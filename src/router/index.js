import { createRouter, createWebHistory } from 'vue-router'
import EntryView from '../views/EntryView.vue'
import ExamView from '../views/ExamView.vue'
import ResultView from '../views/ResultView.vue'
import AdminView from '../views/AdminView.vue'
import CourseLearn from '../views/CourseLearn.vue'
import PackageLearn from '../views/PackageLearn.vue'
import QueryView from '../views/QueryView.vue'
import MineView from '../views/MineView.vue'
import ExamCenter from '../views/ExamCenter.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'entry', component: EntryView },
    { path: '/learn', name: 'learn', component: PackageLearn },
    { path: '/learn/package/:key', name: 'package-learn', component: PackageLearn },
    { path: '/learn/course/:id', name: 'course-learn', component: CourseLearn },
    { path: '/query', name: 'query', component: QueryView },
    { path: '/mine', name: 'mine', component: MineView },
    { path: '/exam-center', name: 'exam-center', component: ExamCenter },
    { path: '/exam', name: 'exam', component: ExamView },
    { path: '/result', name: 'result', component: ResultView },
    { path: '/admin', name: 'admin', component: AdminView },
  ]
})

export default router
