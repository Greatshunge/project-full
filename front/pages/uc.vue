<template>
  <div class="outli-box">
    <h1>用户中心</h1>
    <i class="el-icon-loading"></i>
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFilerChange" />
    </div>
    <!-- <div>
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="uploadProgress"
      ></el-progress>
    </div> -->
    <div>
      <el-button @click="uploadFile">上传</el-button>
    </div>
    <div>
      <p>计算hash的进度</p>
      <el-progress
        :stroke-width="20"
        :text-inside="true"
        :percentage="hashProgress"
      ></el-progress>
    </div>
    <div>
      <!-- chunk.progress
        progress<0 报错 显示红色
        == 100 成功
        别的数字 方块高度显示
        尽可能让方块看起来显示正方形
        比如10个方块 4*4
        9 3*3 -->
      <div class="cube-container" :style="{ width: cubeWidth + 'px' }">
        <div class="cube" v-for="chunk in chunks" :key="chunk.name">
          <div
            :class="{
              uploading: chunk.progress > 0 && chunk.progress < 100,
              success: chunk.progress == 100,
              error: chunk.progress < 0
            }"
            :style="{ height: chunk.progress + '%' }"
          >
            <i
              class="el-icon-loading"
              style="color:#f56c6c;"
              v-if="chunk.progress < 100 && chunk.progress > 0"
            ></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import sparkMD5 from "spark-md5";
const CHUNK_SIZE = 1 * 1024 * 1024;
const CHUNK_SIZE_2 = 100 * 1024;
export default {
  async mounted() {
    const ret = await this.$http.get("/user/info");
    console.log(ret);
    this.bindEvents();
  },
  data() {
    return {
      file: null,
      //   uploadProgress: 0,
      hashProgress: 0,
      chunks: []
    };
  },
  computed: {
    cubeWidth() {
      return Math.ceil(Math.sqrt(this.chunks.length)) * 16;
    },
    uploadProgress() {
      if (!this.file || this.chunks.length) {
        return 0;
      }
      const loaded = this.chunks
        .map(item => item.chunk.size * item.progress)
        .reduce((acc, cur) => acc + cur, 0);
      return parseInt(((loaded * 100) / this.file.size).toFixed(2));
    }
  },
  methods: {
    bindEvents() {
      const drag = this.$refs.drag;
      drag.addEventListener("dragover", e => {
        drag.style.borderColor = "red";
        e.preventDefault();
      });
      drag.addEventListener("dragleave", e => {
        drag.style.borderColor = "#eee";
        e.preventDefault();
      });
      drag.addEventListener("drop", e => {
        const fileList = e.dataTransfer.files;
        drag.style.borderColor = "#eee";
        this.file = fileList[0];
        e.preventDefault();
      });
    },
    async blobToString(blob) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = function() {
          const ret = reader.result
            .split("")
            .map(v => v.charCodeAt())
            .map(v => v.toString(16).toUpperCase())
            .map(v => v.padStart(2, "0"))
            .join("");
          resolve(ret);
        };
        reader.readAsBinaryString(blob);
      });
    },
    async isGif(file) {
      // GIF89a 和 GIF87a
      // 前面6个16进制, '47 49 46 38 39 61' '47 49 46 38 37 61'
      //   16进制的转换
      const ret = await this.blobToString(file.slice(0, 6));
      const isGif = ret == "47 49 46 38 39 61" || ret == "47 49 46 38 37 61";
      return isGif;
    },
    async isPng(file) {
      const ret = await this.blobToString(file.slice(0, 6));
      const isPng = ret == "89 05 4E 47 0D 0A 1A 0A";
      return isPng;
    },
    async isJpg(file) {
      const len = file.size;
      const start = await this.blobToString(file.slice(0, 2));
      const tail = await this.blobToString(file.slice(-2, len));
      const isJpg = start == "FF D8" && tail == "FF D9";
      return isJpg;
    },
    async isImage(file) {
      // 通过文件流来判断
      return (await this.isGif(file)) || (await this.isPng(file));
    },
    createFileChunk(file, size = CHUNK_SIZE_2) {
      const chunks = [];
      let cur = 0;
      while (cur < file.size) {
        chunks.push({ index: cur, file: file.slice(cur, cur + size) });
        cur += size;
      }
      return chunks;
    },
    async calculateHashWorker() {
      return new Promise(resolve => {
        this.worker = new Worker("/hash.js");
        this.worker.postMessage({ chunks: this.chunks });
        this.worker.onmessage = e => {
          const { progress, hash } = e.data;
          this.hashProgress = Number(progress.toFixed(2));
          if (hash) {
            resolve(hash);
          }
        };
      });
    },
    async calculateHashIdle() {
      const chunks = this.chunks;
      return new Promise(resolve => {
        const spark = new sparkMD5.ArrayBuffer();
        let count = 0;
        const appendToSpark = async file => {
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = e => {
              spark.append(e.target.result);
              resolve();
            };
          });
        };
        const workLoop = async deadline => {
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            // 空闲时间，且有任务
            await appendToSpark(chunks[count].file);
            count++;
            if (count < chunks.length) {
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              );
            } else {
              this.hashProgress = 100;
              resolve(spark.end());
            }
          }
          window.requestIdleCallback(workLoop);
        };
        window.requestIdleCallback(workLoop);
      });
    },
    async calculateHashSample() {
      // 布隆过滤器 判断一个数据存在与否
      // 1个G文件，抽样后5M以内
      // hash一样，文件不一定一样
      return new Promise(resolve => {
        const spark = new sparkMD5.ArrayBuffer();
        const reader = new FileReader();

        const file = this.file;
        const size = file.size;
        const offset = 2 * 1024 * 1024;
        // 第一个2M，最后一个区块数据全要
        let chunks = [file.slice(0, offset)];

        let cur = offset;
        while (cur < size) {
          if (cur + offset >= size) {
            // 最后一个区块
            chunks.push(file.slice(cur, cur + offset));
          } else {
            // 中间的区块
            const mid = cur + offset / 2;
            const end = cur + offset;
            chunks.push(file.slice(cur, cur + 2));
            chunks.push(file.slice(mid, mid + 2));
            chunks.push(file.slice(end - 2, end));
          }
          cur += offset;
        }
        // 中间的，取前后各2个字节
        reader.readAsArrayBuffer(new Blob(chunks));
        reader.onload = e => {
          spark.append(e.target.result);
          this.hashProgress = 100;
          resolve(spark.end());
        };
      });
    },
    async uploadFile() {
      //   if (!(await this.isImage(this.file))) {
      //     this.$message.info("文件格式不对");
      //     return;
      //   }
      if (!this.file) {
        this.$message.info("请选择文件上传!");
        return;
      }
      const chunks = this.createFileChunk(this.file);
      //   const hash = await this.calculateHashWorker();
      //   const hash2 = await this.calculateHashIdle();
      const hash = await this.calculateHashSample();
      this.hash = hash;

      //   文件是否上传过，如果没有，是否有存在的切片
      const {
        data: { uploaded, uploadedList }
      } = await this.$http.post("checkfile", {
        hash: this.hash,
        ext: this.file.name.split(".").pop()
      });
      if (uploaded) {
        // 秒传
        return this.$message.success("秒传成功!");
      }
      // 抽样hash 不算全量
      // 布隆过滤器 损失一小部分精度，换取效率

      this.chunks = chunks.map((chunk, index) => {
        // 切片的名字 hash+index
        const name = hash + "-" + index;
        return {
          hash,
          name,
          index,
          chunk: chunk.file,
          // 设置进度条，已经上传的，设为100
          progress: uploadedList.indexOf(name) > -1 ? 100 : 0
        };
      });
      await this.uploadChunks(uploadedList);
    },
    async uploadChunks(uploadedList = []) {
      const requests = this.chunks
        .filter(chunk => uploadedList.indexOf(chunk.name) == -1)
        .map((chunk, index) => {
          // 转成promise
          const form = new FormData();
          form.append("chunk", chunk.chunk);
          form.append("name", chunk.name);
          form.append("hash", chunk.hash);
          return { form, index: chunk.index, error: 0 };
        });
      //   .map(({ form, index }) =>
      //     this.$http.post("/uploadfile", form, {
      //       onUploadProgress: progress => {
      //         // 不是整体的进度条，而是每个区块有自己的进度条，整体的进度条需要计算
      //         this.chunks[index].progress = Number(
      //           ((progress.loaded / progress.total) * 100).toFixed(2)
      //         );
      //       }
      //     })
      //   );
      // @todo 并发量控制
      // 尝试申请tcp链接过多，会导致卡顿
      // 异步的并发数控制
      //    await Promise.all(requests);
      await this.sendRequest(requests);
      await this.mergeRequest();
      //   const form = new FormData();
      //   form.append("name", this.file.name);
      //   form.append("file", this.file);
      //   const ret = await this.$http.post("/uploadfile", form, {
      //     onUploadProgress: progress => {
      //       this.uploadProgress = Number(
      //         ((progress.loaded / progress.total) * 100).toFixed(2)
      //       );
      //     }
      //   });
    },
    // 思考:TCP慢启动，先上传一个初始区块，比如10kb，根据上传成功时间，决定下一个区块是多少K
    // 上传可能报错
    // 报错之后，进度条变红，开始重试
    // 一个切片重试三次，整体全部终止
    async sendRequest(chunks, limit = 4) {
      // limit并发数量
      return new Promise((resolve, reject) => {
        const len = chunks.length;
        let counter = 0;
        let isStop = false;
        const start = async () => {
          if (isStop) {
            return;
          }
          const task = chunks.shift();
          if (task) {
            const { form, index } = task;
            try {
              await this.$http.post("/uploadfile", form, {
                onUploadProgress: progress => {
                  // 不是整体的进度条，而是每个区块有自己的进度条，整体的进度条需要计算
                  this.chunks[index].progress = Number(
                    ((progress.loaded / progress.total) * 100).toFixed(2)
                  );
                }
              });
              if (counter == len - 1) {
                // 最后一个任务
                resolve();
              } else {
                counter++;
                // 启动下一个任务
                start();
              }
            } catch (e) {
              this.chunks[index].progress = -1;
              if (task.error < 3) {
                task.error++;
                chunks.unshift(task);
                start();
              } else {
                // 错误三次
                isStop = true;
                reject();
              }
            }
          }
        };
        while (limit > 0) {
          // 启动limit个任务
          //   模拟一下延迟
          setTimeout(() => {
            start();
          }, Math.random() * 2000);

          limit -= 1;
        }
      });
    },
    async mergeRequest() {
      this.$http.post("mergefile", {
        ext: this.file.name.split(".").pop(),
        size: CHUNK_SIZE_2,
        hash: this.hash
      });
    },
    handleFilerChange(e) {
      const [file] = e.target.files;
      if (!file) return;
      this.file = file;
    }
  }
};
</script>

<style lang="scss" scoped>
.outli-box {
  width: 80%;
  margin: 50px auto;
}
#drag {
  height: 100px;
  line-height: 100px;
  border: 2px dashed #eee;
  text-align: center;
  vertical-align: middle;
}
.cube-container {
  .cube {
    width: 14px;
    height: 14px;
    line-height: 12px;
    border: 1px solid black;
    background: #eee;
    float: left;
    > .success {
      background: green;
    }
    > .upload {
      background: blue;
    }
    > .error {
      background: red;
    }
  }
}
</style>
