<template>
  <div class="kkb-container">
    <VirtualList :listData="articles" :estimatedItemSize="300">
      <div>ppp</div>
    </VirtualList>
  </div>
</template>

<script>
import VirtualList from "~/components/VirtualList";
export default {
  components: {
    VirtualList
  },
  data() {
    return {
      articles: []
    };
  },
  async mounted() {
    let ret = await this.$http.get("article");
    if (ret.code == 0) {
      this.articles = ret.data;
    }
  },
  methods: {
    toUpload() {
      this.$router.push("/uc");
    },
    toEdit() {
      this.$router.push("/editor/new");
    }
  }
};
</script>

<style>
.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
html {
  height: 100%;
}
body {
  height: 100%;
  margin: 0;
}
.kkb-container {
  width: 980px;
  height: 75vh;
  margin: 0 auto;
  background: #fff;
  padding: 20px;
}
</style>
