<template>
  <PublicLayout>
    <v-sheet class="hero-panel pa-6 pa-md-10" rounded="xl" elevation="0">
      <div class="eyebrow mb-4">{{ routeLabel }}</div>
      <h1 class="text-h3 text-md-h2 font-weight-bold mb-4">{{ title }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-8">
        {{ description }}
      </p>

      <v-row dense>
        <v-col v-for="item in items" :key="item.title" cols="12" md="4">
          <v-card class="feature-card fill-height" rounded="xl" elevation="0">
            <v-card-title>{{ item.title }}</v-card-title>
            <v-card-text>{{ item.text }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </PublicLayout>
</template>

<script setup>
import PublicLayout from "../layouts/PublicLayout.vue";

defineProps({
  routeLabel: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
});
</script>
