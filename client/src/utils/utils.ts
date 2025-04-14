/* eslint-disable @typescript-eslint/no-unused-vars */
const removeSpecialCharacter = (str: string) => {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, '')
}
export const generateNameId = ({ name, id }: { name: string; id: number }) => {
  const formattedName = removeSpecialCharacter(name).replace(/\s/g, '-')
  return `${id}-${formattedName}`
}

export const getIdFromNameId = (nameId: string) => {
  return nameId.split('-')[0]
}

export function formatCurrency(currency: number) {
  return new Intl.NumberFormat('de-DE').format(currency)
}

export function formatNumberToSocialStyle(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumSignificantDigits: 1
  })
    .format(value)
    .replace('.', ',')
}
export function convertS3Url(inputUrl: string): string {
  const httpS3UrlPattern = /^https?:\/\/([^.]+)\.s3\.([^/]+)\.amazonaws\.com\/(.+)$/

  const s3UrlPattern = /^s3:\/\/([^/]+)\/(.+)$/

  const httpMatch = inputUrl.match(httpS3UrlPattern)
  if (httpMatch) {
    const [, bucket, region, key] = httpMatch
    const newKey = key.split('/master.m3u8')[0]
    return `s3://${bucket}/${newKey}`
  }

  const s3Match = inputUrl.match(s3UrlPattern)
  if (s3Match) {
    return inputUrl
  }
  throw new Error('Invalid S3 URL format')
}
