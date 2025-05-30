import { PostProcessorModule, StringMap, TOptions } from 'i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import cs from './locales/cs.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fa from './locales/fa.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import hu from './locales/hu.json';
import id from './locales/id.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import nbNO from './locales/nb-NO.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import ptBr from './locales/pt-BR.json';
import ru from './locales/ru.json';
import sr from './locales/sr.json';
import sv from './locales/sv.json';
import ta from './locales/ta.json';
import zhHans from './locales/zh-Hans.json';
import zhHant from './locales/zh-Hant.json';

const resources = {
    cs: { translation: cs },
    de: { translation: de },
    en: { translation: en },
    es: { translation: es },
    fa: { translation: fa },
    fi: { translation: fi },
    fr: { translation: fr },
    hu: { translation: hu },
    id: { translation: id },
    it: { translation: it },
    ja: { translation: ja },
    ko: { translation: ko },
    'nb-NO': { translation: nbNO },
    nl: { translation: nl },
    pl: { translation: pl },
    'pt-BR': { translation: ptBr },
    ru: { translation: ru },
    sr: { translation: sr },
    sv: { translation: sv },
    ta: { translation: ta },
    'zh-Hans': { translation: zhHans },
    'zh-Hant': { translation: zhHant },
};

export const languages = [
    {
        label: 'English',
        value: 'en',
    },
    {
        label: 'Čeština',
        value: 'cs',
    },
    {
        label: 'Español',
        value: 'es',
    },
    {
        label: 'Deutsch',
        value: 'de',
    },
    {
        label: 'Français',
        value: 'fr',
    },
    {
        label: 'Bahasa Indonesia',
        value: 'id',
    },
    {
        label: 'Suomeksi',
        value: 'fi',
    },
    {
        label: 'Magyar',
        value: 'hu',
    },
    {
        label: 'Italiano',
        value: 'it',
    },
    {
        label: '日本語',
        value: 'ja',
    },
    {
        label: '한국어',
        value: 'ko',
    },
    {
        label: 'Nederlands',
        value: 'nl',
    },
    {
        label: 'Norsk (Bokmål)',
        value: 'nb-NO',
    },
    {
        label: 'فارسی',
        value: 'fa',
    },
    {
        label: 'Português (Brasil)',
        value: 'pt-BR',
    },
    {
        label: 'Polski',
        value: 'pl',
    },
    {
        label: 'Русский',
        value: 'ru',
    },
    {
        label: 'Srpski',
        value: 'sr',
    },
    {
        label: 'Svenska',
        value: 'sv',
    },
    {
        label: 'Tamil',
        value: 'ta',
    },
    {
        label: '简体中文',
        value: 'zh-Hans',
    },
    {
        label: '繁體中文',
        value: 'zh-Hant',
    },
];

const lowerCasePostProcessor: PostProcessorModule = {
    name: 'lowerCase',
    process: (value: string) => {
        return value.toLocaleLowerCase();
    },
    type: 'postProcessor',
};

const upperCasePostProcessor: PostProcessorModule = {
    name: 'upperCase',
    process: (value: string) => {
        return value.toLocaleUpperCase();
    },
    type: 'postProcessor',
};

const titleCasePostProcessor: PostProcessorModule = {
    name: 'titleCase',
    process: (value: string) => {
        return value.replace(/\S\S*/g, (txt) => {
            return txt.charAt(0).toLocaleUpperCase() + txt.slice(1).toLowerCase();
        });
    },
    type: 'postProcessor',
};

const ignoreSentenceCaseLanguages = ['de'];

const sentenceCasePostProcessor: PostProcessorModule = {
    name: 'sentenceCase',
    process: (value: string, _key: string, _options: TOptions<StringMap>, translator: any) => {
        const sentences = value.split('. ');

        return sentences
            .map((sentence) => {
                return (
                    sentence.charAt(0).toLocaleUpperCase() +
                    (!ignoreSentenceCaseLanguages.includes(translator.language)
                        ? sentence.slice(1).toLocaleLowerCase()
                        : sentence.slice(1))
                );
            })
            .join('. ');
    },
    type: 'postProcessor',
};
i18n.use(lowerCasePostProcessor)
    .use(upperCasePostProcessor)
    .use(titleCasePostProcessor)
    .use(sentenceCasePostProcessor)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        fallbackLng: 'en',
        // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
        // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
        // if you're using a language detector, do not define the lng option
        interpolation: {
            escapeValue: false, // react already safes from xss
        },
        resources,
    });

export default i18n;
