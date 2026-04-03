<template>
  <div class="room-list">
    <v-row v-if="loading" dense>
      <v-col
        v-for="index in 3"
        :key="index"
        cols="12"
        md="6"
        xl="4"
      >
        <v-skeleton-loader type="article, actions" />
      </v-col>
    </v-row>

    <v-alert
      v-else-if="errorMessage"
      type="error"
      variant="tonal"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-else-if="rooms.length === 0"
      type="info"
      variant="tonal"
    >
      Nenhuma sala disponível no momento.
    </v-alert>

    <v-row v-else dense>
      <v-col
        v-for="room in rooms"
        :key="room.id"
        cols="12"
        md="6"
        xl="4"
      >
        <RoomCard
          :room="room"
          :can-edit="canEditRoom(room)"
          :current-user-id="currentUserId"
          @room-selected="$emit('room-selected', $event)"
          @room-edit-requested="$emit('room-edit-requested', $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import RoomCard from "./RoomCard.vue";

const props = defineProps({
  rooms: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  currentUserId: {
    type: String,
    default: "",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["room-selected", "room-edit-requested"]);

function canEditRoom(room) {
  return props.isAdmin || room.proprietarioId === props.currentUserId;
}
</script>

<style scoped>
.room-list {
  min-height: 12rem;
}
</style>
