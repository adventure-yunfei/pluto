import noop from 'lodash/noop';
import arrayToMap from '../../utils/arrayToMap';
import { alertDlg } from './dialog';

const AUDIO_RESOURCES = [
    {key: 'villager_win', src: '/audios/villager_win.mp3'},
    {key: 'killer_close', src: '/audios/killer_close.mp3'},
    {key: 'killer_confirm', src: '/audios/killer_confirm.mp3'},
    {key: 'killer_open', src: '/audios/killer_open.mp3'},
    {key: 'killer_win', src: '/audios/killer_win.mp3'},
    {key: 'predictor_close', src: '/audios/predictor_close.mp3'},
    {key: 'predictor_open', src: '/audios/predictor_open.mp3'},
    {key: 'witch_close', src: '/audios/witch_close.mp3'},
    {key: 'witch_open', src: '/audios/witch_open.mp3'},
    {key: 'dawn_coming', src: '/audios/dawn_coming.mp3'},
    {key: 'night_start', src: '/audios/night_start.mp3'},
    {key: 'game_end', src: '/audios/game_end.mp3'},
    {key: 'killer_killing', src: '/audios/killer_killing.mp3'},
    {key: 'predictor_checking', src: '/audios/predictor_checking.mp3'},
    {key: 'witch_curing', src: '/audios/witch_curing.mp3'},
    {key: 'witch_poisoning', src: '/audios/witch_poisoning.mp3'}
];
const _audioKeyMap = arrayToMap(AUDIO_RESOURCES, 'key');

const waitFor = timeout => !timeout ? Promise.resolve() : new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
});

const playAudio = (audioId) => new Promise((resolve, reject) => {
    const audioNode = document.getElementById(audioId);
    if (!audioNode) {
        reject(`找不到音频节点(${audioId})`);
        return;
    }
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
});

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

export function requestAudioPlayPermissionOnMobile() {
    return alertDlg({
        content: '请点击确认以在手机端上开启音频播放功能',
        onOK() {
            AUDIO_RESOURCES.forEach(({key}) => {
                const audioNode = document.getElementById(key);
                audioNode && audioNode.load();
            });
        }
    });
}
