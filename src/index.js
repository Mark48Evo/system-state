import SystemState from './systemState';

/**
 * @param {Redis} redis
 * @param {Channel} channel
 * @returns {Promise<RabbitMQPubSub>}
 */
export default async function (redis, channel) {
  const systemState = new SystemState(redis, channel);
  await systemState.setup();

  return systemState;
}
