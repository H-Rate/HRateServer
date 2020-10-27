export const pages2offset = (perPage: number, page: number): [number, number] => {
  const limit = perPage
  const skip = (page - 1) * perPage
  return [limit, skip]
}
