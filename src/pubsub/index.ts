import {PubSub,CreateTopicResponse} from '@google-cloud/pubsub'
import config from 'config'

export let pubsubClient: PubSub = null


export const getClient = (): PubSub => {
  return pubsubClient
}


export const setClient = (client: PubSub): void => {
  pubsubClient = client
}

export const connect = async(): Promise<PubSub> => {
  const pubsubclient = getClient()
  if(!pubsubClient){
    const projectId = config.get('gcppubsub.projectId')
    setClient(new PubSub({projectId}))
  }
  return getClient()
}

export const createTopic = async(topicName:string):Promise<CreateTopicResponse> =>{
  return pubsubClient.createTopic(topicName)
}
