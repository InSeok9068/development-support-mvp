const routes = [
  {
    path: '/',
    name: '인덱스 & TODO',
    component: () => import('@/views/todo/TodoView.vue'),
  },
  {
    path: '/sign',
    name: '로그인 & 가입',
    component: () => import('@/views/sign/SignView.vue'),
  },
  {
    path: '/detail/:id',
    name: 'TODO 상세',
    component: () => import('@/views/todo/TodoDetailView.vue'),
  },
  {
    path: '/list',
    name: 'TODO 리스트',
    component: () => import('@/views/todo/TodoListView.vue'),
  },
  {
    path: '/calendar',
    name: 'TODO 캘린더',
    component: () => import('@/views/calendar/CalendarView.vue'),
  },
  {
    path: '/dashboard',
    name: 'TODO 대시보드',
    component: () => import('@/views/dashboard/DashboardView.vue'),
  },
  {
    path: '/project-gantt',
    name: 'Project Gantt',
    component: () => import('@/views/project-gantt/ProjectGanttView.vue'),
  },
  {
    path: '/setting',
    name: '설정',
    component: () => import('@/views/setting/SettingView.vue'),
  },
  {
    path: '/notification',
    name: '알림함',
    component: () => import('@/views/notification/NotificationView.vue'),
  },
];

export default routes;
