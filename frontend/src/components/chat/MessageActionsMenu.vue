<template>
  <v-menu location="bottom end">
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        icon="mdi-dots-horizontal"
        size="small"
        variant="text"
        :disabled="disabled"
      />
    </template>

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-pencil-outline"
        title="Editar mensagem"
        :disabled="disabled"
        @click="$emit('edit-requested')"
      />
      <v-list-item
        prepend-icon="mdi-delete-outline"
        title="Remover mensagem"
        :disabled="disabled"
        @click="$emit('remove-requested')"
      />
    </v-list>
  </v-menu>
</template>

<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["edit-requested", "remove-requested"]);
</script>
