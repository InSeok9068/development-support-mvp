const routes = [
  {
    path: '/',
    component: () => import('@/views/todo/TodoView.vue'),
  },
  {
    path: '/sign',
    component: () => import('@/views/sign/SignView.vue'),
  },
  {
    path: '/detail/:id',
    component: () => import('@/views/todo/TodoDetailView.vue'),
  },
  {
    path: '/list',
    component: () => import('@/views/todo/TodoListView.vue'),
  },
];

export default routes;
