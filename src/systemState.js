import Debug from 'debug';
import { EventEmitter } from 'events';
import RabbitMQPubSub from '@mark48evo/rabbitmq-pubsub';

const debug = Debug('system:state');

const defaultConfig = {
  exchangeName: process.env.EXCHANGE_NAME || 'system_state',
  queueNamePrefix: process.env.QUEUE_NAME_PREFIX || 'system_state',
};

export default class SystemState extends EventEmitter {
  constructor(redis, rabbitmqChannel, options = {}) {
    super();

    const config = { ...defaultConfig, ...options };

    this.redis = redis;
    this.pubsub = new RabbitMQPubSub(rabbitmqChannel, config);
  }

  async setup() {
    await this.pubsub.setup();

    this.pubsub.on('*', (message) => {
      const stateName = message.eventName;
      const body = message.data;

      debug(`PubSub new state "${stateName}"`);

      this.emit(stateName, body.value, body);
      this.emit('*', stateName, body.value, body);
    });
  }

  get(name) {
    debug(`GET: "${name}"`);

    return new Promise((resolve, reject) => {
      this.redis.get(name, (err, reply) => {
        if (err) {
          return reject(err);
        }

        if (reply) {
          const json = JSON.parse(reply);

          return resolve(json.value);
        }

        return resolve(reply);
      });
    });
  }

  set(name, value) {
    debug(`SET: "${name}"`);
    const body = {
      value,
      timestamp: Math.floor(Date.now() / 1000),
      processId: process.pid,
      processName: process.argv0,
    };

    this.redis.set(name, JSON.stringify(body));
    this.pubsub.publish(name, body);
  }

  all() {
    return new Promise((resolve, reject) => {
      this.redis.keys('*', async (err, keys) => {
        if (err) {
          return reject(err);
        }

        const results = keys.map(key => this.get(key));

        return resolve(await Promise.all(results));
      });
    });
  }
}
