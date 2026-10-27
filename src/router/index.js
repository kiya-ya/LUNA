import { createRouter, createWebHistory } from 'vue-router'
import EntryView from '../views/EntryView.vue'
import ExamView from '../views/ExamView.vue'
import ResultView from '../views/ResultView.vue'
import AdminView from '../views/AdminView.vue'
import LearnHome from '../views/LearnHome.vue'
import CourseLearn from '../views/CourseLearn.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'entry', component: EntryView },
    { path: '/learn', name: 'learn', component: LearnHome },
    { path: '/learn/course/:id', name: 'course-learn', component: CourseLearn },
    { path: '/exam', name: 'exam', component: ExamView },
    { path: '/result', name: 'result', component: ResultView },
    { path: '/admin', name: 'admin', component: AdminView },
  ]
})

export default router
