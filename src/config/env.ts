import 'dotenv/config';

import * as joi from 'joi';


interface EnvVars {
  PORT: number;
  NATS_SERVERS: string[]
}

const envsSchema = joi.object({
  PORT: joi.number().required(),
  NATS_SERVER:joi.array().items( joi.string() ).required()
}).unknown(true)

const { error, value } = envsSchema.validate({
    ...process.env, 
    NATS_SERVER: process.env.NATS_SERVER?.split(',')
  });


if( error ) {
  throw new Error( `config validation error: ${ error?.message}`)
}

const envVars:EnvVars = value;

export const envs = {
  port: envVars.PORT,
  natsServer: envVars.NATS_SERVERS
}


