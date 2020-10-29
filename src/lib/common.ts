import _ from 'lodash'

const TOKENVALUES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"

export const generateToken = (length: number,exceptions:string[] = []):string =>{
  const tokenValuesArray = _.split(TOKENVALUES,'');
  const val =  _.join(_.range(length).map(x=>{
    return tokenValuesArray[_.random(tokenValuesArray.length)]
  }),'')
  return exceptions.includes(val) ? generateToken(length,exceptions) : val
}
