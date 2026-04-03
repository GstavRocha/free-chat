<template>
  <div class="public-layout" :class="pageClass">
    <v-container class="public-layout__container">
      <v-row align="center" justify="center">
        <v-col cols="12" md="10" lg="8">
          <slot />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
defineProps({
  pageClass: {
    type: [String, Array, Object],
    default: "",
  },
});
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  color: var(--app-text-color);
  padding-block: 3rem;
}

.public-layout__container {
  min-height: 100vh;
}
</style>
