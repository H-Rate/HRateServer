import {PubSub,CreateTopicResponse,CreateSubscriptionResponse,Subscription} from '@google-cloud/pubsub'
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

export const createSubcscription = async(topicName:string,subscriptionName:string):Promise<CreateSubscriptionResponse> =>{
  return pubsubClient.topic(topicName).createSubscription(subscriptionName,{
    enableMessageOrdering: true,
  })
}

export const getSubscribers = async(topicName:string):Promise<any[]> =>{
  return pubsubClient.topic(topicName).getSubscriptions();
}

export const removeSubscriber = async(subscriptionName:string):Promise<unknown> =>{
  const sub = pubsubClient.subscription(subscriptionName);
  await sub.detached();
  return pubsubClient.detachSubscription(subscriptionName);
}

export const deleteTopic = async(topicName:string):Promise<unknown> =>{
  return pubsubClient.topic(topicName).delete();
}

export const deleteSubscription = async(subscriptionName:string):Promise<unknown> =>{
  return pubsubClient.subscription(subscriptionName).delete();
}
