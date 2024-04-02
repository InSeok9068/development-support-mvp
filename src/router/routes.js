const routes = [
  {
    path: '/',
    component: () => import('@/views/TodoView.vue'),
  },
  {
    path: '/sign',
    component: () => import('@/views/SignView.vue'),
  },
  {
    path: '/detail/:id',
    component: () => import('@/views/TodoDetailView.vue'),
  },
];

export default routes;
