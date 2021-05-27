<template>
  <div ref="list" class="kkb-list-container" @scroll="scrollEvent($event)">
    <div class="kkb-list-phantom" :style="{ height: listHeight + 'px' }"></div>
    <div class="kkb-list" :style="{ transform: getTransform }">
      <article-item
        ref="items"
        class="kkb-list-item"
        v-for="item in visibleData"
        :key="item._id"
        :article="item"
        :style="{ height: size + 'px' }"
      ></article-item>
    </div>
  </div>
</template>

<script>
import ArticleItem from "./ArticleItem";
export default {
  components: {
    ArticleItem
  },
  props: {
    listData: {
      type: Array,
      default: () => []
    },
    size: {
      type: Number,
      default: 200
    }
  },
  computed: {
    listHeight() {
      return this.listData.length * this.size;
    },
    //偏移量对应的style
    getTransform() {
      return `translate3d(0,${this.startOffset}px,0)`;
    },
    visibleCount() {
      return Math.ceil(this.screenHeight / this.size);
    },
    //获取真实显示列表数据
    visibleData() {
      console.log(this.listData, this.start, this.end);
      return this.listData.slice(
        this.start,
        Math.min(this.end, this.listData.length)
      );
    }
  },
  data() {
    return {
      startOffset: 0,
      screenHeight: 800,
      start: 0, // 开始的索引
      end: 4 // 结束的索引
    };
  },
  mounted() {
    this.end = this.start + this.visibleCount;
  },
  methods: {
    scrollEvent() {
      let scrollTop = this.$refs.list.scrollTop;
      this.start = Math.floor(scrollTop / this.size);
      this.end = this.start + this.visibleCount;
      this.startOffset = scrollTop - (scrollTop % this.size);
    }
  }
};
</script>

<style lang="scss">
.kkb-list-container {
  height: 100%;
  overflow: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
}
.kkb-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}
.kkb-list {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
}
.kkb-list-item {
  padding: 10px;
  color: #555;
  border-bottom: 1px solid #999;
}
</style>
