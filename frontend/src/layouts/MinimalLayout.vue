<template>
  <div class="minimal-layout" :class="pageClass">
    <v-container class="minimal-layout__container">
      <v-row align="center" justify="center">
        <v-col cols="12" md="9" lg="7">
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
.minimal-layout {
  min-height: 100vh;
  background: var(--app-page-background);
  color: var(--app-text-color);
  padding-block: 3rem;
}

.minimal-layout__container {
  min-height: 100vh;
}
</style>
