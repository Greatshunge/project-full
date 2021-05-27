<template>
  <div class="login-container">
    <el-form
      class="login-form"
      label-width="100px"
      :model="form"
      :rules="rules"
      ref="loginForm"
    >
      <div class="title-container">
        <img class="logo-container" src="/logo.png" alt="" />
      </div>
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img @click="resetCaptcha" :src="code.captcha" alt="" srcset="" />
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>

      <el-form-item
        prop="emailcode"
        label="邮箱验证码"
        class="captcha-container"
      >
        <div class="captcha">
          <el-button
            @click="sendEmailCode"
            :disabled="send.timer > 0"
            type="primary"
            >{{ sendText }}</el-button
          >
        </div>
        <el-input
          v-model="form.emailcode"
          placeholder="请输入邮箱验证码"
        ></el-input>
      </el-form-item>

      <el-form-item prop="passwd" label="密码">
        <el-input
          type="password"
          v-model="form.passwd"
          placeholder="请输入密码"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click.native="handleLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import md5 from "md5";
export default {
  layout: "login",
  computed: {
    sendText() {
      if (this.send.timer <= 0) {
        return "发送";
      }
      return `${this.send.timer}s后发送`;
    }
  },
  data() {
    return {
      send: {
        timer: 0
      },
      form: {
        email: "15118826274@139.com",
        passwd: "12345678",
        captcha: "",
        emailcode: ""
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱" },
          { type: "email", message: "请输入正确的邮箱格式" }
        ],
        captcha: [{ required: true, message: "请输入验证码" }],
        emailcode: [{ required: true, message: "请输入邮箱验证码" }],
        passwd: [
          {
            required: true,
            pattern: /^[\w_-]{6,12}/g,
            message: "请输入6-12位密码"
          }
        ]
      },
      code: {
        captcha: "/api/captcha?_t=" + new Date().getTime()
      }
    };
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(async valic => {
        if (valic) {
          console.log("效验成功~");
          let obj = {
            email: this.form.email,
            passwd: md5(this.form.passwd),
            captcha: this.form.captcha,
            emailcode: this.form.emailcode
          };
          let res = await this.$http.post("/user/login", obj);
          // code=0 成功
          if (res.code == 0) {
            // token的存储，登录成功，返回token
            this.$message.success("登录成功");
            localStorage.setItem("token", res.data.token);
            setTimeout(() => {
              this.$router.push("/");
            }, 500);
          } else {
            this.$message.error(res.message);
          }
        } else {
          console.log("效验失败~");
        }
      });
    },
    async sendEmailCode() {
      // @todo
      await this.$http.get("/sendcode?email=" + this.form.email);
      this.send.timer = 10;
      this.timer = setInterval(() => {
        this.send.timer -= 1;
        if (this.send.timer === 0) {
          clearInterval(this.timer);
        }
      }, 1000);
    },
    resetCaptcha() {
      this.code.captcha = "/api/captcha?_t=" + new Date().getTime();
    }
  }
};
</script>

<style lang="scss">
.logo-container {
  width: 250px;
}
</style>
