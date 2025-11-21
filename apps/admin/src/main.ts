import './style.css'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import VueCurrencyInput from 'vue-currency-input'

const app = createApp(App)
app.use(router)
app.use(VueCurrencyInput, {
    globalOptions: {
        currency: 'BRL',
        locale: 'pt-BR',
        precision: 2,
        autoDecimalDigits: true,
        useGrouping: true,
        accountingSign: false,
        valueAsInteger: false
    }
})

app.mount('#app')

