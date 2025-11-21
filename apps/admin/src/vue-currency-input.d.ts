declare module 'vue-currency-input' {
  import { App, Plugin } from 'vue'

  export interface CurrencyInputOptions {
    currency?: string
    locale?: string
    precision?: number
    autoDecimalDigits?: boolean
    useGrouping?: boolean
    accountingSign?: boolean
    valueAsInteger?: boolean
  }

  export interface CurrencyInputPluginOptions {
    globalOptions?: CurrencyInputOptions
  }

  const VueCurrencyInput: Plugin & {
    install(app: App, options?: CurrencyInputPluginOptions): void
  }

  export default VueCurrencyInput
}

