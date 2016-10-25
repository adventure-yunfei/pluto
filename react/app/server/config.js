import globalConfig from '../../../config.json';

export default {
    apiServer: `http://localhost:${globalConfig.hosts.django.by_port}`,
    port: globalConfig.hosts.react.by_port
};
