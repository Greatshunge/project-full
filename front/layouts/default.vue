<template>
  <el-container>
    <el-header>
      <el-menu class="el-menu-demo" mode="horizontal">
        <el-menu-item index="0">
          <img style="width:120px;" src="/logo.png" alt="" />
        </el-menu-item>

        <el-menu-item index="1">
          <nuxt-link to="/">首页</nuxt-link>
        </el-menu-item>

        <el-menu-item v-if="userinfo.id" index="3" class="pull-right">
          <a @click="logout">退出</a>
        </el-menu-item>

        <el-menu-item v-if="userinfo.id" index="4" class="pull-right">
          <user-display :user="userinfo"> </user-display>
        </el-menu-item>

        <el-menu-item v-if="userinfo.id" index="3" class="pull-right">
          <nuxt-link to="/editor/new">
            <el-button type="primary">写文章</el-button>
          </nuxt-link>
          <nuxt-link to="/uc">
            <el-button type="primary">上传文件</el-button></nuxt-link
          >
        </el-menu-item>

        <el-menu-item v-if="!userinfo.id" index="2" class="pull-right">
          <nuxt-link to="/register">注册</nuxt-link>
        </el-menu-item>

        <el-menu-item v-if="!userinfo.id" index="3" class="pull-right">
          <nuxt-link to="/login">登录</nuxt-link>
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="kkb-main-container">
      <nuxt />
    </el-main>
    <el-footer class="kkb-footer-container">
      <div>底部信息</div>
    </el-footer>
  </el-container>
</template>

<script>
import UserDisplay from "~/components/UserDisplay";
export default {
  components: { UserDisplay },
  computed: {
    userinfo() {
      console.log(this.$store.state.user);
      return this.$store.state.user || {};
    }
  },
  mounted() {
    this.getUserInfo();
  },
  methods: {
    logout() {
      localStorage.removeItem("token");
      this.$store.commit("user/LOGOUT");
    },
    async getUserInfo() {
      const token = localStorage.getItem("token");
      if (token) {
        this.$store.dispatch("user/detail");
      }
    }
  }
};
</script>

<style>
html {
  font-family: "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  background: #eee;
}
.pull-right {
  float: right !important;
}
*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}
.logo {
  height: 37px;
}
a {
  text-decoration: none;
}
.kkb-main-container {
  min-height: 50vh;
  background: #fff;
  margin: 20px;
}
.kkb-footer-container {
  background: #fff;
  display: flex;
  align-items: center;
  margin: 0 20px;
}

.el-menu--horizontal > .el-menu-item.is-active {
  border: none;
}
</style>
