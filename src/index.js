import SystemState from './systemState';

/**
 * @param {Redis} redis
 * @param {Channel} channel
 * @param {object} options
 * @returns {Promise<RabbitMQPubSub>}
 */
export default async function (redis, channel, options = {}) {
  const systemState = new SystemState(redis, channel, options);
  await systemState.setup();

  return systemState;
}
