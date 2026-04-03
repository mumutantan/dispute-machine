import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Vant 组件按需引入
import {
  Button,
  Cell,
  CellGroup,
  Field,
  Form,
  NavBar,
  Tabbar,
  TabbarItem,
  Icon,
  Toast,
  Dialog,
  NoticeBar,
  Dialog as VanDialog,
  Stepper
} from 'vant'

// Vant 样式
import 'vant/lib/index.css'

// 全局样式
import './styles/main.css'

const app = createApp(App)

// 注册 Vant 组件
app.use(Button)
app.use(Cell)
app.use(CellGroup)
app.use(Field)
app.use(Form)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Icon)
app.use(Toast)
app.use(Dialog)
app.use(NoticeBar)
app.use(Stepper)

app.use(createPinia())
app.use(router)

app.mount('#app')
