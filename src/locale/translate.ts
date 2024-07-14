import { LOCALE_EN_US } from '@/locale/en-us'
import { LOCALE_KO_KR } from '@/locale/ko-kr'
import { locale } from '@/main'
import { Locale } from '@/types/locale'

export function translate(key: keyof Locale): string {
  let localeObject: Locale

  switch (locale) {
    case 'en-us':
      localeObject = LOCALE_EN_US
      break
    case 'ko-kr':
      localeObject = LOCALE_KO_KR
      break
    default:
      throw new Error(`Unsupported locale: ${locale}`)
  }

  return localeObject[key]
}
