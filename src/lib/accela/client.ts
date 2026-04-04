const ACCELA_BASE = "https://apis.accela.com"
const ACCELA_AUTH = "https://auth.accela.com/oauth2/token"
const AGENCY = "PALOALTO"
const ENVIRONMENT = "PROD"

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  const appId = process.env.ACCELA_APP_ID
  const appSecret = process.env.ACCELA_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error("ACCELA_APP_ID and ACCELA_APP_SECRET must be set")
  }

  const res = await fetch(ACCELA_AUTH, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-accela-appid": appId,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: appId,
      client_secret: appSecret,
      scope: "records addresses contacts documents",
      agency_name: AGENCY,
      environment: ENVIRONMENT,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Accela auth failed: ${res.status} ${text}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.token
}

async function accelaRequest(
  method: "GET" | "POST" | "PUT",
  path: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const appId = process.env.ACCELA_APP_ID!
  const token = await getAccessToken()

  const res = await fetch(`${ACCELA_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-accela-agency": AGENCY,
      "x-accela-environment": ENVIRONMENT,
      "x-accela-appid": appId,
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }

  console.log(`[Accela] ${method} ${path} → ${res.status}`)
  return { ok: res.ok, status: res.status, data }
}

export interface AccelaProjectData {
  projectType: string
  address: string
  zipCode: string
  description: string
  estimatedValuation: number
  aduSqft?: number | null
  lotSizeSqft?: number | null
  yearBuilt?: number | null
  apn?: string | null
  separatelyMetered?: boolean
  fireWestOf280?: boolean
  hasSprinklers?: boolean
  hasEarthwork?: boolean
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  ownerPhone?: string | null
  ownerAddressLine1: string
  ownerCity: string
  ownerState: string
  ownerZip: string
  contractorFirstName?: string | null
  contractorLastName?: string | null
  contractorBusinessName?: string | null
  contractorLicenseNumber?: string | null
  contractorPhone?: string | null
  contractorEmail?: string | null
}

const PROJECT_TYPE_TO_ACCELA: Record<
  string,
  { group: string; type: string; subType: string; category: string }
> = {
  adu_detached: { group: "Building", type: "Residential", subType: "ADU", category: "New" },
  adu_attached: { group: "Building", type: "Residential", subType: "ADU", category: "Attached" },
  jadu: { group: "Building", type: "Residential", subType: "ADU", category: "Junior" },
  addition: { group: "Building", type: "Residential", subType: "Addition", category: "NA" },
  remodel: { group: "Building", type: "Residential", subType: "Remodel", category: "NA" },
}

function parseStreetAddress(fullAddress: string) {
  const street = fullAddress.split(",")[0].trim()
  const parts = street.split(" ")
  const streetNumber = parseInt(parts[0]) || 0
  const streetSuffix = parts[parts.length - 1] ?? ""
  const streetName = parts.slice(1, -1).join(" ")
  return { streetNumber, streetName, streetSuffix }
}

export async function createPartialRecord(data: AccelaProjectData) {
  const typeConfig = PROJECT_TYPE_TO_ACCELA[data.projectType] ?? PROJECT_TYPE_TO_ACCELA.remodel
  const addr = parseStreetAddress(data.address)

  const body = {
    type: { ...typeConfig, module: "Building" },
    description: data.description,
    estimatedTotalJobCost: data.estimatedValuation,
    addresses: [
      {
        streetStart: addr.streetNumber,
        streetName: addr.streetName,
        streetSuffix: { value: addr.streetSuffix },
        city: "Palo Alto",
        state: { value: "CA" },
        postalCode: data.zipCode,
        isPrimary: "Y",
      },
    ],
    contacts: [
      {
        type: { value: "Owner" },
        firstName: data.ownerFirstName,
        lastName: data.ownerLastName,
        email: data.ownerEmail,
        phone1: data.ownerPhone ?? "",
        isPrimary: "Y",
      },
    ],
    owners: [
      {
        firstName: data.ownerFirstName,
        lastName: data.ownerLastName,
        email: data.ownerEmail,
        isPrimary: "Y",
      },
    ],
  }

  const result = await accelaRequest("POST", "/v4/records/initialize", body)
  if (!result.ok) throw new Error(`Failed to create record: ${JSON.stringify(result.data)}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = (result.data as any)?.result
  return {
    recordId: record?.id as string,
    customId: (record?.customId ?? "") as string,
    trackingId: String(record?.trackingId ?? ""),
  }
}

export async function updateCustomForms(
  recordId: string,
  data: AccelaProjectData
) {
  const formData = [
    {
      id: "APPLICATION_DETAILS",
      fields: [
        { id: "GIVEN_VALUATION", value: String(data.estimatedValuation) },
        ...(data.aduSqft
          ? [{ id: "NEW_STRUCTURE_CONDITIONED_SQFT", value: String(data.aduSqft) }]
          : []),
        { id: "DETAILED_DESCRIPTION", value: data.description },
      ],
    },
  ]

  const result = await accelaRequest("PUT", `/v4/records/${recordId}/customForms`, formData)
  if (!result.ok) throw new Error(`Failed to update forms: ${JSON.stringify(result.data)}`)
}

export async function uploadDocuments(
  recordId: string,
  pdfBuffer: Buffer,
  fileName: string
) {
  const appId = process.env.ACCELA_APP_ID!
  const token = await getAccessToken()

  const formData = new FormData()
  const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" })
  formData.append("file", blob, fileName)
  formData.append("docType", "Plans")

  const res = await fetch(`${ACCELA_BASE}/v4/records/${recordId}/documents`, {
    method: "POST",
    headers: {
      "x-accela-agency": AGENCY,
      "x-accela-environment": ENVIRONMENT,
      "x-accela-appid": appId,
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) throw new Error(`Failed to upload documents: ${res.status}`)
}

export async function finalizeRecord(recordId: string) {
  const result = await accelaRequest("POST", `/v4/records/${recordId}/finalize`)
  if (!result.ok) throw new Error(`Failed to finalize: ${JSON.stringify(result.data)}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = (result.data as any)?.result
  return {
    customId: (record?.customId ?? "") as string,
    status: (record?.status?.value ?? "Submitted") as string,
  }
}

export async function getRecordStatus(recordId: string) {
  const result = await accelaRequest("GET", `/v4/records/${recordId}`)
  if (!result.ok) throw new Error(`Failed to get status: ${result.status}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const record = (result.data as any)?.result
  return {
    status: (record?.status?.value ?? "Unknown") as string,
    statusText: (record?.status?.text ?? "Unknown") as string,
    fees: record?.totalFee as number | undefined,
  }
}
