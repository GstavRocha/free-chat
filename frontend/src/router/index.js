import { createRouter, createWebHistory } from "vue-router";
import RouteStubPage from "./RouteStubPage.vue";
import { hasAdminSession, hasStoredSession } from "./session";
import CreateRoomPage from "../pages/CreateRoomPage.vue";
import ChatRoomPage from "../pages/ChatRoomPage.vue";
import AdminPanelPage from "../pages/AdminPanelPage.vue";
import EditRoomPage from "../pages/EditRoomPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import NotFoundPage from "../pages/NotFoundPage.vue";
import RegistrationRequestPage from "../pages/RegistrationRequestPage.vue";
import RoomsListPage from "../pages/RoomsListPage.vue";

const routes = [
  {
    path: "/",
    name: "entry",
    component: RouteStubPage,
    meta: {
      publicOnly: true,
    },
    props: {
      routeLabel: "Rota publica",
      title: "Free Chat Maker",
      description:
        "Ponto de entrada da aplicacao, preparado para evoluir em login, cadastro e redirecionamento por sessao.",
      items: [
        {
          title: "Entrada",
          text: "Tela inicial para visitantes, com encaminhamento para login ou solicitacao de cadastro.",
        },
        {
          title: "Arquitetura",
          text: "Roteamento principal configurado conforme a arvore canonica das specs de frontend.",
        },
        {
          title: "Proximo passo",
          text: "As guardas publicas, autenticadas e administrativas entram nas etapas seguintes da FASE 7.",
        },
      ],
    },
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: {
      publicOnly: true,
    },
  },
  {
    path: "/cadastro",
    name: "registration-request",
    component: RegistrationRequestPage,
    meta: {
      publicOnly: true,
    },
  },
  {
    path: "/salas",
    name: "rooms-list",
    component: RoomsListPage,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/salas/nova",
    name: "room-create",
    component: CreateRoomPage,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/salas/:id/editar",
    name: "room-edit",
    component: EditRoomPage,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/salas/:id",
    name: "room-chat",
    component: ChatRoomPage,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/admin",
    name: "admin-panel",
    component: AdminPanelPage,
    meta: {
      requiresAdmin: true,
    },
  },
  {
    path: "/nao-encontrada",
    name: "not-found",
    component: NotFoundPage,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: {
      name: "not-found",
    },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.publicOnly && hasStoredSession()) {
    return { name: "rooms-list" };
  }

  if (to.meta.requiresAuth && !hasStoredSession()) {
    return { name: "login" };
  }

  if (to.meta.requiresAdmin) {
    if (!hasStoredSession()) {
      return { name: "login" };
    }

    if (!hasAdminSession()) {
      return { name: "rooms-list" };
    }
  }

  return true;
});
