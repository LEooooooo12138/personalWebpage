import { createApp } from 'vue'
import './style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { createWebHistory, createRouter } from 'vue-router'

import App from './App.vue'
import index from './views/index.vue'
import About from './views/about.vue'
import PastProject from './views/pastProject.vue'
import currentProject from './views/currentProject.vue'
import contact from './views/contactMe.vue'
import NotFound from './views/NotFound.vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// import vue-i18n to achieve switch language
import { createI18n } from 'vue-i18n'
import zh from './locales/zh.js'
import en from './locales/en.js'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faEnvelope, faUser, faPhone, faLanguage } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faEnvelope, faUser, faPhone, faLanguage)

const language = localStorage.getItem('language') || 'zh'

const i18n = createI18n ({
    legacy : false,
    locale: language,

    messages: {
        zh: zh,
        en: en,
    }
})



const routes = [
    { path: '/', 
        name: 'home',component: index },
    { path: '/about',
        name: 'about', component: About},
    { path: '/past', component: PastProject},
    { path: '/current', component: currentProject},
    { path: '/contact', component: contact},
    { path: '/:catchAll(.*)', component: NotFound}


]

const router = createRouter({
    history: createWebHistory(),
    routes,
})  


const app = createApp(App)
app.use(router)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.use(i18n)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
