import _ from 'lodash'

const TOKENVALUES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"

export const generateToken = (length: number):string =>{
  const tokenValuesArray = _.split(TOKENVALUES,'');
  return _.join(_.range(length).map(x=>{
    return tokenValuesArray[_.random(tokenValuesArray.length)]
  }),'')
}
