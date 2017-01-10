import noop from 'lodash/noop';
import arrayToMap from '../../utils/arrayToMap';

const AUDIO_RESOURCES = [
    {key: 'villager_win', src: '/audios/villager_win.wav'},
    {key: 'killer_close', src: '/audios/killer_close.wav'},
    {key: 'killer_confirm', src: '/audios/killer_confirm.wav'},
    {key: 'killer_open', src: '/audios/killer_open.wav'},
    {key: 'killer_win', src: '/audios/killer_win.wav'},
    {key: 'predictor_close', src: '/audios/predictor_close.wav'},
    {key: 'predictor_open', src: '/audios/predictor_open.wav'},
    {key: 'witch_close', src: '/audios/witch_close.wav'},
    {key: 'witch_open', src: '/audios/witch_open.wav'},
    {key: 'dawn_coming', src: '/audios/dawn_coming.wav'},
    {key: 'night_start', src: '/audios/night_start.wav'},
    {key: 'game_end', src: '/audios/game_end.wav'},
    {key: 'killer_killing', src: '/audios/killer_killing.wav'},
    {key: 'predictor_checking', src: '/audios/predictor_checking.wav'},
    {key: 'witch_curing', src: '/audios/witch_curing.wav'},
    {key: 'witch_poisoning', src: '/audios/witch_poisoning.wav'}
];
const _audioKeyMap = arrayToMap(AUDIO_RESOURCES, 'key');

const waitFor = timeout => !timeout ? Promise.resolve() : new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
});

const playAudio = (audioId) => new Promise((resolve, reject) => {
    let cnt = 0,
        maxCnt = 200;
    const findAudioNode = () => {
        const audioNode = document.getElementById(audioId);
        if (audioNode) {
            resolve(audioNode);
        } else {
            cnt++;
            if (cnt >= maxCnt) {
                reject(`找不到音频节点(${audioId})`);
            } else {
                setTimeout(findAudioNode, 50);
            }
        }
    };
    findAudioNode();
}).then(audioNode => new Promise((resolve, reject) => {
    audioNode.play().then(() => {
        const checkPlayEnd = () => {
            if (audioNode.currentTime >= audioNode.duration) {
                resolve();
            } else {
                setTimeout(checkPlayEnd, 50);
            }
        };
        checkPlayEnd();
    }, err => {
        window.alert(`播放音频失败: ${audioNode.id}`);
        reject(err);
    });
}));

class AudioPlayerManager {
    _promise = Promise.resolve()
    _playEndTime = 0

    constructor() {
        AUDIO_RESOURCES.forEach(({key, src}) => {
            const audioNode = document.createElement('audio');
            audioNode.id = key;
            audioNode.src = src;
            audioNode.preload = 'auto';
            document.body.appendChild(audioNode);
        });
    }

    pushAudioPlay({key, waitBefore = 2000}) {
        if (_audioKeyMap[key] == null) {
            window.alert(`音频id不存在: ${key}`);
            return;
        }
        this._promise = this._promise
            .then(() => {
                const timeout = Math.max(0, waitBefore + this._playEndTime - Date.now());
                return waitFor(timeout);
            })
            .then(() => playAudio(key))
            .catch(noop)
            .finally(() => this._playEndTime = Date.now());
    }
}

const audioPlayerManager = new AudioPlayerManager();

/**@param {string|{key: string, waitBefore: number}} audioCfg */
export function pushAudioPlay(audioCfg) {
    if (typeof audioCfg === 'string') {
        audioCfg = {
            key: audioCfg,
            waitBefore: 2000
        };
    }
    audioPlayerManager.pushAudioPlay(audioCfg);
}
