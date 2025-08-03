// Vue API 通过 auto-import 自动导入，无需手动 import
import './style.css';
import App from './App.vue';

createApp(App).mount(
  (() => {
    const app = document.createElement('div');
    document.body.append(app);
    return app;
  })(),
);
