<template> <div class="min-h-screen bg-animated relative"> <!-- 顶部导航栏 --> <header class="glass-nav relative z-10"> <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"> <div class="flex items-center gap-3"> <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"> <span class="text-xl"></span> </div> <h1 class="text-lg font-bold text-white">点点开黑 · 考试管理后台</h1> </div> <div class="flex items-center gap-4"> <button @click="startAdminTest" class="text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-all flex items-center gap-1"> <span></span> 测试考试
          </button> <span class="text-sm text-white/70">管理员</span> <button @click="goHome" class="text-sm text-white hover:text-white/80 font-bold">退出</button> </div> </div> </header> <!-- 主体内容 --> <main class="max-w-7xl mx-auto px-4 py-6"> <!-- 统计卡片 --> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"> <div class="glass-card relative z-10 p-5"> <div class="text-sm text-gray-500 mb-1"> 题库题目</div> <div class="text-2xl font-bold text-gray-900">{{ stats.total }}</div> </div> <div class="glass-card relative z-10 p-5"> <div class="text-sm text-gray-500 mb-1"> 单选题</div> <div class="text-2xl font-bold text-primary">{{ stats.single }}</div> </div> <div class="glass-card relative z-10 p-5"> <div class="text-sm text-gray-500 mb-1"> 累计考生</div> <div class="text-2xl font-bold text-success">{{ allResults.length }}</div> </div> <div class="glass-card relative z-10 p-5"> <div class="text-sm text-gray-500 mb-1"> 回收站</div> <div class="text-2xl font-bold text-gray-600">{{ recycleBinItems.length }}</div> </div> <div class="glass-card relative z-10 p-5"> <div class="text-sm text-gray-500 mb-1"> 智能生题</div> <div class="text-2xl font-bold text-secondary">{{ aiGenCount }}</div> </div> </div> <!-- 功能卡片 --> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6"> <div @click="currentTab = 'questions'" class="glass-card relative z-10 p-6 cursor-pointer hover:shadow-lg transition-all border-2" :class="currentTab === 'questions' ? 'border-primary' : 'border-transparent'"> <div class="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4"> <span class="text-2xl"></span> </div> <h3 class="text-lg font-bold text-gray-900 mb-1">题库管理</h3> <p class="text-sm text-gray-500">查看、编辑题库</p> </div> <div @click="currentTab = 'exams'" class="glass-card relative z-10 p-6 cursor-pointer hover:shadow-lg transition-all border-2" :class="currentTab === 'exams' ? 'border-primary' : 'border-transparent'"> <div class="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center mb-4"> <span class="text-2xl"></span> </div> <h3 class="text-lg font-bold text-gray-900 mb-1">考试配置</h3> <p class="text-sm text-gray-500">创建试卷、历史试卷</p> </div> <div @click="currentTab = 'results'" class="glass-card relative z-10 p-6 cursor-pointer hover:shadow-lg transition-all border-2" :class="currentTab === 'results' ? 'border-primary' : 'border-transparent'"> <div class="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4"> <span class="text-2xl"></span> </div> <h3 class="text-lg font-bold text-gray-900 mb-1">成绩统计</h3> <p class="text-sm text-gray-500">查看成绩、导出Excel</p> </div> <div @click="currentTab = 'recycle'" class="glass-card relative z-10 p-6 cursor-pointer hover:shadow-lg transition-all border-2" :class="currentTab === 'recycle' ? 'border-primary' : 'border-transparent'"> <div class="w-12 h-12 bg-gray-200/50 rounded-2xl flex items-center justify-center mb-4"> <span class="text-2xl"></span> </div> <h3 class="text-lg font-bold text-gray-900 mb-1">回收站</h3> <p class="text-sm text-gray-500">{{ recycleBinItems.length }} 个已删除项目</p> </div> <div @click="currentTab = 'ai-gen'" class="glass-card relative z-10 p-6 cursor-pointer hover:shadow-lg transition-all border-2" :class="currentTab === 'ai-gen' ? 'border-primary' : 'border-transparent'"> <div class="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4"> <span class="text-2xl"></span> </div> <h3 class="text-lg font-bold text-gray-900 mb-1">智能生题</h3> <p class="text-sm text-gray-500">上传文档，AI生成题目</p> </div> <div @click="currentTab = 'learn'" class="glass-card relative z-10 p-6 cursor-pointer hover:shadow-lg transition-all border-2" :class="currentTab === 'learn' ? 'border-primary' : 'border-transparent'"> <div class="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4"> <span class="text-2xl"></span> </div> <h3 class="text-lg font-bold text-gray-900 mb-1">课程管理</h3> <p class="text-sm text-gray-500">课包、课程、学员进度</p> </div> </div> <!-- 题库管理内容 --> <div v-if="currentTab === 'questions'" class="glass-card relative z-10 p-6"> <!-- 题库切换 + 编辑 --> <div class="flex items-center justify-between mb-4"> <div class="flex items-center gap-3"> <h2 class="text-lg font-bold text-gray-900"> 题库管理</h2> <!-- 题库切换 --> <div class="relative"> <button @click="showBankMenu = !showBankMenu" class="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary font-bold text-sm rounded-xl hover:bg-primary/20 transition-all"> <span>{{ questionBanks.find(b => b.id === currentBankId)?.name || '默认题库' }}</span> <svg :class="showBankMenu ? 'rotate-180' : ''" class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </button> <div v-show="showBankMenu" class="absolute left-0 mt-2 w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"> <div class="max-h-60 overflow-y-auto"> <div v-for="bank in questionBanks" :key="bank.id" class="flex items-center justify-between px-4 py-2 hover:bg-primary-light cursor-pointer group" @click="switchBank(bank.id)"> <span class="text-sm font-bold truncate" :class="bank.id === currentBankId ? 'text-primary' : 'text-gray-700'">
                      {{ bank.id === currentBankId ? ' ' : '　　' }}{{ bank.name }}
                    </span> <div class="flex items-center gap-1"> <span @click.stop="openEditBank(bank)" class="text-xs text-gray-400 hover:text-primary ml-1 opacity-0 group-hover:opacity-100 transition-opacity"></span> <span v-if="bank.id !== currentBankId" @click.stop="deleteBank(bank.id)" class="text-xs text-gray-400 hover:text-danger ml-1 opacity-0 group-hover:opacity-100 transition-opacity"></span> </div> </div> </div> <div class="border-t border-gray-100 px-4 py-2"> <button @click="showNewBankModal = true; showBankMenu = false" class="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-1"> <span></span> 新建题库
                  </button> </div> </div> </div> </div> <div class="relative"> <button @click="showEditMenu = !showEditMenu" class="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors flex items-center gap-2"> <span></span> 编辑题库
              <svg :class="showEditMenu ? 'rotate-180' : ''" class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path> </svg> </button> <div v-show="showEditMenu" class="absolute right-0 mt-2 w-40 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"> <button @click="openAddQuestion" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-primary-light hover:text-primary font-bold transition-colors flex items-center gap-2"> <span></span> 新增题目
              </button> <button @click="showImportModal = true; showEditMenu = false" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-primary-light hover:text-primary font-bold transition-colors flex items-center gap-2"> <span></span> 批量导入
              </button> <button @click="toggleEditMode" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-primary-light hover:text-primary font-bold transition-colors flex items-center gap-2"> <span></span> {{ editMode ? '退出修改' : '修改题目' }}
              </button> <button @click="exportQuestionsToExcel(); showEditMenu = false" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-primary-light hover:text-primary font-bold transition-colors flex items-center gap-2"> <span></span> 导出题库
              </button> </div> </div> </div> <!-- 新建题库弹窗 --> <div v-if="showNewBankModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> <div class="bg-white rounded-2xl p-6 w-full max-w-sm"> <h3 class="text-lg font-bold text-gray-900 mb-4">新建题库</h3> <input v-model="newBankName" type="text" placeholder="请输入题库名称" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mb-4"> <div class="flex gap-3"> <button @click="showNewBankModal = false" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="createBank" class="flex-1 h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all">新建</button> </div> </div> </div> <!-- 编辑题库弹窗 --> <div v-if="showEditBankModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> <div class="bg-white rounded-2xl p-6 w-full max-w-sm"> <h3 class="text-lg font-bold text-gray-900 mb-4">编辑题库</h3> <input v-model="editBankName" type="text" placeholder="请输入题库名称" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mb-4"> <div class="flex gap-3"> <button @click="showEditBankModal = false" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="saveEditBank" class="flex-1 h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all">保存</button> </div> </div> </div> <!-- 批量导入弹窗 --> <div v-if="showImportModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> <div class="bg-white rounded-2xl p-6 w-full max-w-sm"> <h3 class="text-lg font-bold text-gray-900 mb-2"> 批量导入题目</h3> <p class="text-sm text-gray-500 mb-4">支持 Word(.docx) 或 Excel(.xlsx) 文件</p> <div class="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center mb-4 hover:border-primary transition-all cursor-pointer" @click="$refs.importFile.click()"> <div class="text-3xl mb-2"></div> <p class="text-sm text-gray-600 font-bold">点击选择文件</p> <p class="text-xs text-gray-400 mt-1">{{ importFileName || '支持 .docx / .xlsx' }}</p> </div> <input ref="importFile" type="file" accept=".docx,.xlsx" class="hidden" @change="handleImportFile"> <div class="flex gap-3"> <button @click="showImportModal = false; importFileName = ''" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="submitImport" :disabled="!importFileName || importing" class="flex-1 h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all disabled:opacity-50">
                {{ importing ? '导入中...' : '开始导入' }}
              </button> </div> </div> </div> <!-- 题目列表 --> <div class="overflow-x-auto" style="min-width: 100%;"> <table class="w-full text-sm whitespace-nowrap"> <thead> <tr class="border-b-2 border-primary-light"> <th class="text-left py-3 px-3 font-bold text-gray-500 w-12">#</th> <th class="text-left py-3 px-3 font-bold text-gray-500 w-16">题型</th> <th class="text-left py-3 px-3 font-bold text-gray-500" style="min-width: 200px;">题干</th> <th class="text-left py-3 px-3 font-bold text-gray-500" style="min-width: 150px;">选项</th> <th class="text-left py-3 px-3 font-bold text-gray-500" style="min-width: 100px;">答案</th> <th class="text-left py-3 px-3 font-bold text-gray-500" style="min-width: 200px;">答案解析</th> <th class="text-left py-3 px-3 font-bold text-gray-500 w-24">题目启用</th> <th v-if="editMode" class="text-left py-3 px-3 font-bold text-gray-500 w-24">操作</th> </tr> </thead> <tbody> <tr v-for="q in paginatedQuestions" :key="q.id" class="border-b border-gray-100 hover:bg-primary-light/20 transition-colors" :class="q.enabled === false ? 'opacity-50 bg-gray-50' : ''"> <td class="py-3 px-3">{{ q.id }}</td> <td class="py-3 px-3"> <span class="px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap" :class="typeClass(q.type)">{{ typeLabel(q.type) }}</span> </td> <td class="py-3 px-3"> <div class="max-w-xs truncate cursor-pointer hover:text-primary transition-colors" :title="q.title" @click="openQuestionPreview(q)">{{ q.title }}</div> </td> <td class="py-3 px-3"> <div class="max-w-xs truncate text-gray-600" :title="q.options?.join(' / ') || '-'">
                    {{ q.options?.join(' / ') || '-' }}
                  </div> </td> <td class="py-3 px-3 text-gray-600"> <div class="max-w-xs truncate" :title="q.type === 'single' || q.type === 'multiple' ? q.answer : q.type === 'fill' ? q.blanks.map(b => b.answer).join(' / ') : '-'">
                    {{ q.type === 'single' || q.type === 'multiple' ? q.answer : q.type === 'fill' ? q.blanks.map(b => b.answer).join(' / ') : '-' }}
                  </div> </td> <td class="py-3 px-3 text-gray-600"> <div class="max-w-xs truncate" :title="q.keyPoints || '-'">{{ q.keyPoints || '-' }}</div> </td> <td class="py-3 px-3"> <button @click="toggleQuestionEnabled(q)" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0" :class="q.enabled !== false ? 'bg-success' : 'bg-gray-300'"> <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200" :class="q.enabled !== false ? 'translate-x-6' : 'translate-x-1'"></span> </button> <span class="ml-2 text-xs whitespace-nowrap" :class="q.enabled !== false ? 'text-success' : 'text-gray-400'">{{ q.enabled !== false ? '已启用' : '已禁用' }}</span> </td> <td v-if="editMode" class="py-3 px-3 whitespace-nowrap"> <button @click="openEditQuestion(q)" class="text-primary hover:text-primary-dark text-sm font-bold mr-3"></button> <button @click="deleteQuestion(q.id)" class="text-danger hover:text-danger/80 text-sm font-bold"></button> </td> </tr> </tbody> </table> </div> <!-- 分页控件 --> <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100"> <div class="text-sm text-gray-500">
            共 {{ questions.length }} 题，第 {{ currentPage }}/{{ totalPages }} 页
          </div> <div class="flex items-center gap-2"> <button @click="goPage(1)" :disabled="currentPage === 1" class="px-3 py-2 text-sm font-bold rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"></button> <button @click="goPage(currentPage - 1)" :disabled="currentPage === 1" class="px-3 py-2 text-sm font-bold rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"></button> <div class="flex gap-1"> <button v-for="p in pageNumbers" :key="p" @click="goPage(p)" class="w-9 h-9 text-sm font-bold rounded-xl transition-all" :class="p === currentPage ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'">{{ p }}</button> </div> <button @click="goPage(currentPage + 1)" :disabled="currentPage === totalPages" class="px-3 py-2 text-sm font-bold rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"></button> <button @click="goPage(totalPages)" :disabled="currentPage === totalPages" class="px-3 py-2 text-sm font-bold rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"></button> </div> <div class="flex items-center gap-2"> <span class="text-sm text-gray-500">每页</span> <select v-model="pageSize" @change="currentPage = 1" class="px-2 py-1 border-2 border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"> <option :value="20">20</option> <option :value="60">60</option> <option :value="100">100</option> </select> </div> </div> </div> <!-- 考试配置内容 --> <div v-if="currentTab === 'exams'" class="grid grid-cols-1 lg:grid-cols-2 gap-6"> <!-- 左侧：编辑配置 --> <div class="glass-card relative z-10 p-6"> <h2 class="text-lg font-bold text-gray-900 mb-6"> {{ editingConfig ? '编辑试卷' : '创建新试卷' }}</h2> <div class="space-y-5"> <div> <label class="block text-sm font-bold text-gray-700 mb-2">试卷名称</label> <input v-model="examForm.name" type="text" placeholder="例如：姐妹团姐姐考试6月" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">题库来源</label> <select v-model="examForm.bank_id" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"> <option v-for="bank in questionBanks" :key="bank.id" :value="bank.id">{{ bank.name }}</option> </select> </div> <!-- 题型数量 --> <div class="grid grid-cols-4 gap-3"> <div> <label class="block text-sm font-bold text-gray-700 mb-2">单选题数</label> <input v-model.number="examForm.single" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">多选题数</label> <input v-model.number="examForm.multiple" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">填空题数</label> <input v-model.number="examForm.fill" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">简答题数</label> <input v-model.number="examForm.essay" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> </div> <!-- 分值设置 --> <div class="grid grid-cols-4 gap-3"> <div> <label class="block text-sm font-bold text-gray-700 mb-2">单选分值</label> <input v-model.number="examForm.score_single" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">多选分值</label> <input v-model.number="examForm.score_multiple" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">填空分值</label> <input v-model.number="examForm.score_fill" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">简答分值</label> <input v-model.number="examForm.score_essay" type="number" min="0" max="100" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> </div> <div class="flex items-center gap-2"> <input type="checkbox" id="shuffle" checked disabled class="w-4 h-4 text-primary rounded"> <label for="shuffle" class="text-sm text-gray-700"> 题目乱序（默认开启）</label> </div> <!-- 定时发布/截止 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-gray-50/50 border border-gray-100"> <div> <label class="block text-sm font-bold text-gray-700 mb-2"> 定时发布时间</label> <input v-model="examForm.publish_at" type="datetime-local" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"> <p class="text-xs text-gray-400 mt-1">留空则不定时发布</p> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2"> 定时截止时间</label> <input v-model="examForm.stop_at" type="datetime-local" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"> <p class="text-xs text-gray-400 mt-1">留空则不定时截止</p> </div> </div> <div class="flex gap-3"> <button v-if="editingConfig" @click="cancelEdit" class="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="saveExamConfig" class="flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"> <span></span> <span>{{ editingConfig ? '保存修改' : '创建试卷' }}</span> </button> </div> </div> </div> <!-- 右侧：历史试卷 --> <div class="glass-card relative z-10 p-6"> <h2 class="text-lg font-bold text-gray-900 mb-4"> 历史试卷</h2> <div class="space-y-3"> <div v-for="cfg in examConfigs" :key="cfg.id" class="p-4 rounded-2xl border hover:shadow-md transition-all" :class="cfg.status === 'published' ? 'bg-success/5 border-success' : cfg.status === 'draft' ? 'bg-warning/5 border-warning' : 'bg-gray-50 border-gray-200'"> <div class="flex items-center justify-between mb-2"> <div class="flex items-center gap-2"> <h3 class="font-bold text-gray-900">{{ cfg.name }}</h3> <span class="text-xs px-2 py-0.5 rounded-lg font-bold" :class="statusClass(cfg.status)">{{ statusLabel(cfg.status) }}</span> </div> <div class="flex gap-2"> <button v-if="cfg.status === 'draft'" @click="previewExam(cfg)" class="text-xs px-2 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"> 预览</button> <button v-if="cfg.status === 'draft'" @click="publishExam(cfg.id)" class="text-xs px-2 py-1 bg-success text-white rounded-lg hover:bg-success/90 transition-colors"> 发布</button> <button v-if="cfg.status === 'published'" @click="stopExam(cfg.id)" class="text-xs px-2 py-1 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors"> 停止</button> <button v-if="cfg.status === 'stopped'" @click="publishExam(cfg.id)" class="text-xs px-2 py-1 bg-success text-white rounded-lg hover:bg-success/90 transition-colors"> 恢复</button> <button @click="editConfig(cfg)" class="text-xs px-2 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"> 编辑</button> <button @click="deleteConfig(cfg.id)" class="text-xs px-2 py-1 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors"> 删除</button> </div> </div> <p class="text-sm text-gray-600">
                {{ cfg.single || 0 }}单选({{ cfg.score_single || 5 }}分) + {{ cfg.multiple || 0 }}多选({{ cfg.score_multiple || 5 }}分) + {{ cfg.fill || 0 }}填空({{ cfg.score_fill || 5 }}分) + {{ cfg.essay || 0 }}简答({{ cfg.score_essay || 5 }}分) = {{ ((cfg.single || 0) + (cfg.multiple || 0) + (cfg.fill || 0) + (cfg.essay || 0)) }}题，满分{{ ((cfg.single || 0) * (cfg.score_single || 5) + (cfg.multiple || 0) * (cfg.score_multiple || 5) + (cfg.fill || 0) * (cfg.score_fill || 5) + (cfg.essay || 0) * (cfg.score_essay || 5)) }}分
              </p> <p class="text-xs text-gray-400 mt-1">{{ formatTime(cfg.created_at) }}</p> <div v-if="cfg.publish_at || cfg.stop_at" class="text-xs mt-1"> <span v-if="cfg.publish_at" class="text-blue-500"> 发布: {{ formatTime(cfg.publish_at) }}</span> <span v-if="cfg.stop_at" class="text-orange-500 ml-2"> 截止: {{ formatTime(cfg.stop_at) }}</span> </div> <p class="text-xs text-primary mt-2 font-bold"> 题库：{{ questionBanks.find(b => b.id === cfg.bank_id)?.name || '默认题库' }}</p> </div> <div v-if="examConfigs.length === 0" class="text-center text-gray-400 py-8">
              暂无历史试卷
            </div> </div> </div> </div> <!-- 成绩统计内容 --> <div v-if="currentTab === 'results'" class="glass-card relative z-10 p-6"> <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4"> <h2 class="text-lg font-bold text-gray-900"> 成绩统计</h2> <div class="flex items-center gap-3"> <!-- 批量删除按钮 --> <button
              v-if="selectedResultIds.length > 0"
              @click="batchDeleteResults"
              class="px-4 py-2 bg-danger text-white text-sm font-bold rounded-xl hover:bg-danger/80 transition-colors flex items-center gap-1"
            > <span></span> 批量删除({{ selectedResultIds.length }})
            </button> <!-- 试卷下拉框 --> <select v-model="selectedExamId" @change="loadResults" class="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"> <option value="">全部试卷</option> <option v-for="cfg in examConfigs" :key="cfg.id" :value="cfg.id">{{ cfg.name }}</option> </select> <button @click="exportToExcel" class="px-4 py-2 bg-success text-white text-sm font-bold rounded-xl hover:bg-success/90 transition-colors flex items-center gap-1"> <span></span> 导出Excel
            </button> </div> </div> <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b-2 border-primary-light"> <th class="text-left py-3 px-2 font-bold text-gray-500 w-10"> <input
                    type="checkbox"
                    :checked="isAllResultsSelected"
                    @change="toggleSelectAllResults"
                    class="w-4 h-4 text-primary rounded"
                  > </th> <th class="text-left py-3 px-4 font-bold text-gray-500">排名</th> <th class="text-left py-3 px-4 font-bold text-gray-500">点点昵称</th> <th class="text-left py-3 px-4 font-bold text-gray-500">点点UID</th> <th class="text-left py-3 px-4 font-bold text-gray-500">总分</th> <th class="text-left py-3 px-4 font-bold text-gray-500">正确率</th> <th class="text-left py-3 px-4 font-bold text-gray-500">时间</th> <th class="text-left py-3 px-4 font-bold text-gray-500">操作</th> </tr> </thead> <tbody> <tr v-for="(s, i) in filteredResults" :key="s.id" class="border-b border-gray-100 hover:bg-primary-light/20 transition-colors"> <td class="py-3 px-2"> <input
                    type="checkbox"
                    :checked="selectedResultIds.includes(s.id)"
                    @change="toggleResultSelect(s.id)"
                    class="w-4 h-4 text-primary rounded"
                  > </td> <td class="py-3 px-4 font-bold">{{ i + 1 }}</td> <td class="py-3 px-4">{{ s.user_name }}</td> <td class="py-3 px-4">{{ s.user_uid }}</td> <td class="py-3 px-4 font-bold" :class="s.percentage >= 80 ? 'text-success' : s.percentage >= 60 ? 'text-primary' : 'text-danger'">{{ s.total_score }}</td> <td class="py-3 px-4">{{ s.percentage }}%</td> <td class="py-3 px-4">{{ formatTime(s.created_at) }}</td> <td class="py-3 px-4"> <button @click="showResultDetail(s)" class="text-xs px-2 py-1 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mr-2"> 明细</button> <button @click="deleteResult(s.id)" class="text-xs px-2 py-1 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors"> 删除</button> </td> </tr> <tr v-if="filteredResults.length === 0"> <td colspan="8" class="py-8 text-center text-gray-400">暂无考试记录</td> </tr> </tbody> </table> </div> </div> <!-- 回收站内容 --> <div v-if="currentTab === 'recycle'" class="glass-card relative z-10 p-6"> <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4"> <div> <h2 class="text-lg font-bold text-gray-900"> 回收站</h2> <p class="text-sm text-gray-500 mt-1">共 {{ recycleBinItems.length }} 个项目，暂存 {{ recycleBinSettings.retention_days }} 天后自动删除</p> </div> <div class="flex items-center gap-3"> <div class="flex items-center gap-2"> <label class="text-sm text-gray-600">保留天数：</label> <input v-model.number="recycleBinSettings.retention_days" type="number" min="1" max="365" class="w-16 px-2 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 text-center"> <button @click="saveRecycleSettings" class="px-3 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors">保存</button> </div> <button v-if="recycleBinItems.length > 0" @click="clearRecycleBin" class="px-4 py-2 bg-danger text-white text-sm font-bold rounded-xl hover:bg-danger/80 transition-colors">清空回收站</button> </div> </div> <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b-2 border-primary-light"> <th class="text-left py-3 px-4 font-bold text-gray-500">类型</th> <th class="text-left py-3 px-4 font-bold text-gray-500">名称</th> <th class="text-left py-3 px-4 font-bold text-gray-500">删除时间</th> <th class="text-left py-3 px-4 font-bold text-gray-500">过期时间</th> <th class="text-left py-3 px-4 font-bold text-gray-500">操作</th> </tr> </thead> <tbody> <tr v-for="item in recycleBinItems" :key="item.id" class="border-b border-gray-100 hover:bg-primary-light/20 transition-colors"> <td class="py-3 px-4"> <span class="px-2 py-1 rounded-lg text-xs font-bold" :class="item.type === 'exam_config' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'">
                    {{ item.type === 'exam_config' ? ' 试卷' : ' 成绩' }}
                  </span> </td> <td class="py-3 px-4 font-bold">{{ item.type === 'exam_config' ? item.data.name : (item.data.exam_name || examConfigs.find(c => c.id === item.data.exam_id)?.name || '未知试卷') + ' - ' + item.data.user_name }}</td> <td class="py-3 px-4 text-gray-600">{{ formatTime(item.deleted_at) }}</td> <td class="py-3 px-4 text-gray-600"> <span :class="isNearExpire(item.expire_at) ? 'text-danger font-bold' : ''">{{ formatTime(item.expire_at) }}</span> <span v-if="isNearExpire(item.expire_at)" class="text-xs text-danger ml-1">即将过期</span> </td> <td class="py-3 px-4"> <button @click="restoreRecycleItem(item.id)" class="text-xs px-2 py-1 bg-success text-white rounded-lg hover:bg-success/90 transition-colors mr-2"> 恢复</button> <button @click="permanentlyDeleteRecycleItem(item.id)" class="text-xs px-2 py-1 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors"> 彻底删除</button> </td> </tr> <tr v-if="recycleBinItems.length === 0"> <td colspan="5" class="py-8 text-center text-gray-400">回收站为空</td> </tr> </tbody> </table> </div> </div> <!-- 智能生题内容 --> <div v-if="currentTab === 'ai-gen'" class="glass-card relative z-10 p-6"> <h2 class="text-lg font-bold text-gray-900 mb-6"> 智能生题</h2> <!-- 上传区 --> <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"> <div class="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary transition-all cursor-pointer" @click="$refs.aiFileInput.click()"> <div class="text-3xl mb-2"></div> <p class="text-sm text-gray-600 font-bold">点击上传 Word (.docx) 或 PDF (.pdf)</p> <p class="text-xs text-gray-400 mt-1">{{ aiGenFileName || '支持 .docx / .pdf' }}</p> </div> <input ref="aiFileInput" type="file" accept=".docx,.pdf" class="hidden" @change="handleAiGenFile"> <!-- 生成参数 --> <div class="space-y-4"> <div> <label class="block text-sm font-bold text-gray-700 mb-2">目标题库</label> <select v-model="aiGenBankId" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"> <option v-for="bank in questionBanks" :key="bank.id" :value="bank.id">{{ bank.name }}</option> <option :value="-1"> 新建题库</option> </select> </div> <div class="grid grid-cols-4 gap-3"> <div><label class="block text-sm font-bold text-gray-700 mb-1">单选</label><input v-model.number="aiGenSingle" type="number" min="0" max="10" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"></div> <div><label class="block text-sm font-bold text-gray-700 mb-1">多选</label><input v-model.number="aiGenMultiple" type="number" min="0" max="10" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"></div> <div><label class="block text-sm font-bold text-gray-700 mb-1">填空</label><input v-model.number="aiGenFill" type="number" min="0" max="10" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"></div> <div><label class="block text-sm font-bold text-gray-700 mb-1">简答</label><input v-model.number="aiGenEssay" type="number" min="0" max="10" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm"></div> </div> <p class="text-xs text-gray-400"> 每类题型最多 10 题，防止 AI 调用超出限制</p> <div class="grid grid-cols-2 gap-3"> <button @click="submitAiGen" :disabled="!aiGenFileName || aiGenLoading || aiGenUpdateLoading" class="h-12 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50">
                {{ aiGenLoading ? '生成中...' : ' 开始生成题目' }}
              </button> <button @click="submitAiGenUpdate" :disabled="!aiGenFileName || aiGenLoading || aiGenUpdateLoading" class="h-12 bg-gradient-to-r from-success to-primary text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50">
                {{ aiGenUpdateLoading ? '分析中...' : ' 更新题库' }}
              </button> </div> </div> </div> <!-- 题库变体生成 --> <div class="border-t-2 border-gray-100 pt-6 mb-6"> <h3 class="text-md font-bold text-gray-800 mb-2"> 题库变体生成</h3> <p class="text-sm text-gray-500 mb-4">选择现有题目，AI将基于原题生成相似但选项/答案不同的变体题，用于扩充题库</p> <div class="grid grid-cols-1 md:grid-cols-3 gap-4"> <div class="md:col-span-2"> <label class="block text-sm font-bold text-gray-700 mb-2">选择原题</label> <select v-model="aiGenVariantSourceId" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white text-sm"> <option value="">请选择一道题目</option> <option v-for="q in questions" :key="q.id" :value="q.id">【{{ typeLabel(q.type) }}】{{ q.title.length > 40 ? q.title.substring(0, 40) + '...' : q.title }}</option> </select> </div> <div class="flex items-end gap-2"> <div class="flex-1"> <label class="block text-sm font-bold text-gray-700 mb-2">变体数量</label> <input v-model.number="aiGenVariantCount" type="number" min="1" max="5" class="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-center"> </div> <button @click="submitAiGenVariants" :disabled="!aiGenVariantSourceId || aiGenVariantLoading" class="h-11 px-4 bg-gradient-to-r from-secondary to-primary text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 text-sm whitespace-nowrap">
                {{ aiGenVariantLoading ? '...' : ' 生成' }}
              </button> </div> </div> </div> <!-- 智能更新结果展示 --> <div v-if="aiGenUpdateResult && (aiGenUpdateResult.updated.length > 0 || aiGenUpdateResult.added.length > 0)" class="space-y-4 mb-8"> <div class="flex items-center justify-between mb-4"> <h3 class="text-lg font-bold text-gray-900">
               智能更新建议（更新 {{ aiGenUpdateResult.updated.length }} 题 / 新增 {{ aiGenUpdateResult.added.length }} 题）
            </h3> <div class="flex items-center gap-2"> <button @click="importAllUpdateSuggestions" class="text-sm px-4 py-1.5 bg-success text-white font-bold rounded-lg hover:bg-success/90 transition-all">
                导入全部建议
              </button> <button @click="aiGenUpdateResult = null" class="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all">
                清除
              </button> </div> </div> <!-- 需要更新的题目 --> <div v-if="aiGenUpdateResult.updated.length > 0" class="space-y-3"> <h4 class="text-sm font-bold text-orange-600"> 建议更新（{{ aiGenUpdateResult.updated.length }} 题）</h4> <div v-for="(q, idx) in aiGenUpdateResult.updated" :key="'u'+idx" class="p-4 rounded-2xl border-2 border-orange-200 bg-orange-50"> <div class="flex items-center gap-2 mb-2"> <span class="px-2 py-0.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-700">更新</span> <span class="text-xs text-gray-400">原题ID: {{ q.original_id }}</span> <span class="text-xs text-orange-500">{{ q.update_reason }}</span> </div> <p class="text-sm font-bold text-gray-900 mb-2">{{ q.content }}</p> <div v-if="q.options && q.options.length > 0" class="space-y-1 mb-2"> <p v-for="opt in q.options" :key="opt" class="text-xs text-gray-600">{{ opt }}</p> </div> <div class="text-xs text-gray-500"> <span class="font-bold">答案：</span>{{ q.answer || q.key_points || '-' }}
              </div> </div> </div> <!-- 新增的题目 --> <div v-if="aiGenUpdateResult.added.length > 0" class="space-y-3"> <h4 class="text-sm font-bold text-green-600"> 建议新增（{{ aiGenUpdateResult.added.length }} 题）</h4> <div v-for="(q, idx) in aiGenUpdateResult.added" :key="'a'+idx" class="p-4 rounded-2xl border-2 border-green-200 bg-green-50"> <div class="flex items-center gap-2 mb-2"> <span class="px-2 py-0.5 rounded-lg text-xs font-bold bg-green-100 text-green-700">新增</span> <span class="text-xs text-gray-400">#{{ idx + 1 }}</span> </div> <p class="text-sm font-bold text-gray-900 mb-2">{{ q.content }}</p> <div v-if="q.options && q.options.length > 0" class="space-y-1 mb-2"> <p v-for="opt in q.options" :key="opt" class="text-xs text-gray-600">{{ opt }}</p> </div> <div class="text-xs text-gray-500"> <span class="font-bold">答案：</span>{{ q.answer || q.key_points || '-' }}
              </div> </div> </div> </div> <!-- 解析结果展示 --> <div v-if="aiGenQuestions.length > 0 || aiGenTextPreview" class="space-y-4"> <!-- 原文预览 --> <div v-if="aiGenTextPreview" class="p-4 rounded-2xl bg-gray-50 border border-gray-200 mb-4"> <div class="flex items-center justify-between mb-2"> <h4 class="text-sm font-bold text-gray-700"> 文档解析预览（前500字）</h4> <span class="text-xs text-gray-400">{{ aiGenTextPreview.length }} 字符</span> </div> <p class="text-xs text-gray-600 line-clamp-5 whitespace-pre-wrap">{{ aiGenTextPreview }}</p> </div> <div class="flex items-center justify-between mb-4"> <h3 class="text-lg font-bold text-gray-900">生成结果（共 {{ aiGenQuestions.length }} 题）</h3> <div class="flex items-center gap-2"> <button @click="aiGenSelectAll" class="text-sm px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all">全选</button> <button @click="aiGenDeselectAll" class="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-all">取消全选</button> <button @click="importSelectedQuestions" :disabled="aiGenSelectedIds.length === 0" class="text-sm px-4 py-1.5 bg-success text-white font-bold rounded-lg hover:bg-success/90 transition-all disabled:opacity-50">
                导入 {{ aiGenSelectedIds.length }} 题到题库
              </button> </div> </div> <div v-if="aiGenQuestions.length === 0" class="text-center p-8 text-gray-500 bg-gray-50 rounded-2xl border border-gray-200"> <p class="text-2xl mb-2"></p> <p class="font-bold mb-1">未能从文档中提取到有效题目</p> <p class="text-sm text-gray-400">请检查文档是否包含纯文字内容（非扫描件/图片），或尝试修改题型参数</p> </div> <div v-for="(q, idx) in aiGenQuestions" :key="idx" class="p-4 rounded-2xl border-2 transition-all" :class="aiGenSelectedIds.includes(idx) ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'"> <div class="flex items-start gap-3"> <input type="checkbox" :checked="aiGenSelectedIds.includes(idx)" class="mt-1 w-4 h-4 text-primary rounded" @click.stop="toggleAiGenSelect(idx)"> <div class="flex-1"> <div class="flex items-center justify-between mb-2"> <div class="flex items-center gap-2"> <span class="px-2 py-0.5 rounded-lg text-xs font-bold" :class="typeClass(q.type)">{{ typeLabel(q.type) }}</span> <span class="text-xs text-gray-400">#{{ idx + 1 }}</span> </div> <button @click.stop="openAiGenEdit(idx)" class="text-xs px-2 py-1 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all"> 编辑</button> </div> <p class="text-sm font-bold text-gray-900 mb-2">{{ q.content }}</p> <div v-if="q.options && q.options.length > 0" class="space-y-1 mb-2"> <p v-for="opt in q.options" :key="opt" class="text-sm text-gray-600">{{ opt }}</p> </div> <div class="text-xs text-gray-500"> <span class="font-bold">答案：</span>{{ q.answer || q.key_points || '-' }}
                </div> </div> </div> </div> </div> <!-- 智能生题编辑弹窗 --> <div v-if="showAiGenEditModal" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"> <div class="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"> <h3 class="text-lg font-bold text-gray-900 mb-4"> 编辑题目 #{{ editingAiGenIdx + 1 }}</h3> <div class="space-y-4"> <div> <label class="block text-sm font-bold text-gray-700 mb-2">题型</label> <select v-model="aiGenEditForm.type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"> <option value="single">单选题</option> <option value="multiple">多选题</option> <option value="fill">填空题</option> <option value="essay">简答题</option> </select> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">题干</label> <textarea v-model="aiGenEditForm.content" rows="3" placeholder="请输入题目内容" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> </div> <!-- 单选/多选选项 --> <div v-if="aiGenEditForm.type === 'single' || aiGenEditForm.type === 'multiple'"> <label class="block text-sm font-bold text-gray-700 mb-2">选项（每行一个）</label> <textarea v-model="aiGenEditForm.optionsText" rows="4" placeholder="A. 选项1
B. 选项2
C. 选项3
D. 选项4" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> <div> <label class="block text-sm font-bold text-gray-700 mb-2">正确答案</label> <input v-model="aiGenEditForm.answer" type="text" placeholder="例如：A 或 A,B" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> </div> <!-- 填空题答案 --> <div v-if="aiGenEditForm.type === 'fill'"> <label class="block text-sm font-bold text-gray-700 mb-2">填空答案（每行一个，用|分隔多个可选答案）</label> <textarea v-model="aiGenEditForm.blanksText" rows="3" placeholder="空1答案:18|十八
空2答案:98" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">答案解析 / 评分关键词</label> <textarea v-model="aiGenEditForm.key_points" rows="3" placeholder="请输入答案解析或评分关键词" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> </div> </div> <div class="flex gap-3 mt-6"> <button @click="closeAiGenEdit" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="saveAiGenEdit" class="flex-1 h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all">保存修改</button> </div> </div> </div> <!-- 新建题库弹窗（用于智能生题） --> <div v-if="showAiGenNewBank" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"> <div class="bg-white rounded-2xl p-6 w-full max-w-sm"> <h3 class="text-lg font-bold text-gray-900 mb-4">新建题库</h3> <input v-model="aiGenNewBankName" type="text" placeholder="请输入新题库名称" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mb-4"> <div class="flex gap-3"> <button @click="showAiGenNewBank = false" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="createAiGenBank" class="flex-1 h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all">创建</button> </div> </div> </div> </div> <!-- 课程管理内容 --> <div v-if="currentTab === 'learn'" class="space-y-6"> <!-- 课包列表 --> <div class="glass-card relative z-10 p-6"> <div class="flex items-center justify-between mb-4"> <h2 class="text-lg font-bold text-gray-900"> 课程包管理</h2> <button @click="loadPackages" class="text-sm px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all"> 刷新</button> </div> <div class="space-y-4"> <div v-for="pkg in packages" :key="pkg.id" class="p-4 rounded-2xl border-2 transition-all" :class="learnSelectedPkgId === pkg.id ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white/60'"> <div class="flex items-center justify-between mb-3"> <div class="flex items-center gap-2"> <span class="text-xl">{{ pkg.key === 'sister' ? '' : pkg.key === 'trainer' ? '' : '' }}</span> <span class="font-bold text-gray-900">{{ pkg.name }}</span> <span class="text-xs text-gray-400">({{ (pkg.courses || []).length }} 门课程)</span> <span class="text-xs px-2 py-0.5 rounded-full font-bold" :class="pkg.enabled ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'">{{ pkg.enabled ? '启用' : '停用' }}</span> </div> <div class="flex items-center gap-2"> <button @click="learnSelectedPkgId = pkg.id; resetCourseForm()" class="text-xs px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all">管理课程</button> <button @click="deletePackage(pkg)" class="text-xs px-3 py-1.5 bg-danger/10 text-danger font-bold rounded-lg hover:bg-danger/20 transition-all">删除</button> </div> </div> <div class="grid grid-cols-1 md:grid-cols-4 gap-3"> <div> <label class="block text-xs font-bold text-gray-500 mb-1">课包名称</label> <input v-model="pkg.name" type="text" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all"> </div> <div> <label class="block text-xs font-bold text-gray-500 mb-1">挂科冷却天数</label> <input v-model.number="pkg.cooldown_days" type="number" min="0" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all"> </div> <div> <label class="block text-xs font-bold text-gray-500 mb-1">关联试卷配置</label> <select v-model="pkg.exam_config_id" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all bg-white"> <option :value="null">（不关联，无需考试）</option> <option v-for="cfg in examConfigs" :key="cfg.id" :value="cfg.id">{{ cfg.name }} ({{ cfg.status }})</option> </select> </div> <div class="flex items-end gap-2"> <label class="flex items-center gap-1.5 text-sm font-bold text-gray-600 pb-2"> <input v-model="pkg.enabled" type="checkbox" class="w-4 h-4 accent-primary"> 启用
                  </label> <button @click="savePackage(pkg)" class="flex-1 h-9 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all">保存</button> </div> </div> <div class="mt-2"> <input v-model="pkg.description" type="text" placeholder="课包描述" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all"> </div> </div> <div v-if="packages.length === 0" class="text-center text-gray-400 py-6 font-bold">暂无课包</div> </div> </div> <!-- 课程 CRUD --> <div v-if="learnSelectedPkg" class="glass-card relative z-10 p-6"> <h2 class="text-lg font-bold text-gray-900 mb-4"> 「{{ learnSelectedPkg.name }}」课程列表</h2> <!-- 课程表单 --> <div class="p-4 rounded-2xl bg-gray-50 border-2 border-gray-100 mb-5"> <h3 class="text-sm font-bold text-gray-700 mb-3">{{ editingCourseId ? ' 编辑课程' : ' 新增课程' }}</h3> <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3"> <input v-model="courseForm.title" type="text" placeholder="课程标题" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all"> <select v-model="courseForm.type" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all bg-white"> <option value="video"> 视频课</option> <option value="article"> 图文课</option> </select> <input v-model.number="courseForm.duration_minutes" type="number" min="0" :placeholder="courseForm.type === 'article' ? '要求停留分钟数（必填）' : '视频时长（分钟，可选）'" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all"> </div> <!-- 视频课：上传 --> <div v-if="courseForm.type === 'video'" class="mb-3"> <div class="flex items-center gap-3"> <button @click="$refs.videoFileInput.click()" :disabled="videoUploading" class="px-4 py-2 bg-secondary/10 text-secondary font-bold rounded-xl text-sm hover:bg-secondary/20 transition-all disabled:opacity-50">
                  {{ videoUploading ? '上传中 ' + videoUploadPercent + '%' : ' 上传视频' }}
                </button> <input ref="videoFileInput" type="file" accept="video/*,.mp4,.webm,.mov,.mkv,.m4v,.avi" class="hidden" @change="handleVideoUpload"> <span v-if="courseForm.video_path" class="text-xs text-success font-bold truncate"> {{ courseForm.video_path }}</span> <span v-else class="text-xs text-gray-400">未上传视频（500MB 以内）</span> </div> <video v-if="courseForm.video_path" :src="courseForm.video_path" controls class="mt-2 w-full max-w-md rounded-xl bg-black max-h-48"></video> </div> <!-- 图文课：内容 --> <div v-if="courseForm.type === 'article'" class="mb-3"> <textarea v-model="courseForm.content" rows="6" placeholder="图文内容（支持 HTML，如 <h2>标题</h2><p>正文</p>）" class="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all resize-y font-mono"></textarea> </div> <div class="flex gap-2"> <button v-if="editingCourseId" @click="resetCourseForm" class="px-5 h-10 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition-all">取消编辑</button> <button @click="saveCourse" class="flex-1 h-10 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm hover:shadow-lg transition-all">
                {{ editingCourseId ? '保存修改' : '添加课程' }}
              </button> </div> </div> <!-- 课程列表 --> <div v-if="(learnSelectedPkg.courses || []).length === 0" class="text-center text-gray-400 py-6 font-bold">暂无课程，请在上方添加</div> <div v-else class="space-y-2"> <div v-for="(c, idx) in learnSelectedPkg.courses" :key="c.id" class="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-gray-100"> <span class="text-lg">{{ c.type === 'video' ? '' : '' }}</span> <div class="flex-1 min-w-0"> <p class="font-bold text-gray-800 text-sm truncate">{{ idx + 1 }}. {{ c.title }}</p> <p class="text-xs text-gray-400">{{ c.type === 'video' ? '视频课' : '图文课' }}<span v-if="c.duration_minutes"> · {{ c.duration_minutes }} 分钟</span><span v-if="c.video_path"> · {{ c.video_path }}</span></p> </div> <span class="text-xs px-2 py-0.5 rounded-full font-bold" :class="c.enabled ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'">{{ c.enabled ? '启用' : '停用' }}</span> <button @click="toggleCourseEnabled(c)" class="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-all">{{ c.enabled ? '停用' : '启用' }}</button> <button @click="editCourse(c)" class="text-xs px-2.5 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all">编辑</button> <button @click="deleteCourse(c)" class="text-xs px-2.5 py-1.5 bg-danger/10 text-danger font-bold rounded-lg hover:bg-danger/20 transition-all">删除</button> </div> </div> </div> <!-- 学员进度 --> <div class="glass-card relative z-10 p-6"> <div class="flex items-center justify-between mb-4"> <h2 class="text-lg font-bold text-gray-900"> 学员学习进度</h2> <button @click="loadLearnProgress" class="text-sm px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all"> 刷新</button> </div> <div class="flex flex-wrap gap-3 mb-4"> <input v-model="progressFilterUid" type="text" placeholder="按 UID 筛选（可空）" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all w-52" @keyup.enter="loadLearnProgress"> <select v-model="progressFilterPkg" class="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary transition-all bg-white" @change="loadLearnProgress"> <option :value="null">全部课包</option> <option v-for="pkg in packages" :key="pkg.id" :value="pkg.id">{{ pkg.name }}</option> </select> <button @click="loadLearnProgress" class="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all">查询</button> </div> <div v-if="learnProgress.length === 0" class="text-center text-gray-400 py-6 font-bold">暂无学习记录</div> <div v-else class="space-y-3"> <div v-for="stu in learnProgress" :key="stu.uid" class="p-4 rounded-2xl bg-white/70 border border-gray-100"> <div class="flex items-center gap-2 mb-2"> <span class="font-bold text-gray-900">{{ stu.nickname || '（未填昵称）' }}</span> <span class="text-xs text-gray-400">UID: {{ stu.uid }}</span> </div> <div class="grid grid-cols-1 md:grid-cols-2 gap-2"> <div v-for="p in stu.packages" :key="p.package_id" class="p-3 rounded-xl bg-gray-50 border border-gray-100"> <div class="flex items-center justify-between mb-1.5"> <span class="text-sm font-bold text-gray-700">{{ p.package_name }}</span> <span class="text-xs font-bold px-2 py-0.5 rounded-full" :class="examStatusBadge(p.exam_status).cls">{{ examStatusBadge(p.exam_status).text }}</span> </div> <div class="flex items-center gap-2 mb-1.5"> <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"> <div class="h-full bg-gradient-to-r from-primary to-secondary rounded-full" :style="{ width: (p.total_courses ? p.completed_courses / p.total_courses * 100 : 0) + '%' }"></div> </div> <span class="text-xs text-gray-400 font-bold">{{ p.completed_courses }}/{{ p.total_courses }}</span> </div> <div class="space-y-0.5"> <div v-for="c in p.courses" :key="c.course_id" class="flex items-center justify-between text-xs"> <span class="text-gray-500 truncate">{{ c.title }}</span> <span class="font-bold shrink-0 ml-2" :class="c.completed ? 'text-success' : c.progress_percent > 0 ? 'text-primary' : 'text-gray-300'">
                        {{ c.completed ? '' : c.progress_percent > 0 ? Math.floor(c.progress_percent) + '%' : '未开始' }}
                      </span> </div> </div> </div> </div> </div> </div> </div> </div> </main> <!-- 新增/编辑题目弹窗 --> <div v-if="showQuestionModal" class="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"> <div class="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"> <h3 class="text-lg font-bold text-gray-900 mb-4">{{ editingQuestion ? ' 修改题目' : ' 新增题目' }}</h3> <div class="space-y-4"> <div> <label class="block text-sm font-bold text-gray-700 mb-2">题型</label> <select v-model="questionForm.type" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white"> <option value="single">单选题</option> <option value="multiple">多选题</option> <option value="fill">填空题</option> <option value="essay">简答题</option> </select> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">题干</label> <textarea v-model="questionForm.content" rows="3" placeholder="请输入题目内容" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> </div> <!-- 单选/多选选项 --> <div v-if="questionForm.type === 'single' || questionForm.type === 'multiple'"> <label class="block text-sm font-bold text-gray-700 mb-2">选项（每行一个）</label> <textarea v-model="questionForm.optionsText" rows="4" placeholder="A. 选项1
B. 选项2
C. 选项3
D. 选项4" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> <div> <label class="block text-sm font-bold text-gray-700 mb-2">正确答案</label> <input v-model="questionForm.answer" type="text" placeholder="例如：A 或 A,B" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"> </div> </div> <!-- 填空题答案 --> <div v-if="questionForm.type === 'fill'"> <label class="block text-sm font-bold text-gray-700 mb-2">填空答案（每行一个，用|分隔多个可选答案）</label> <textarea v-model="questionForm.blanksText" rows="3" placeholder="空1答案:18|十八
空2答案:98" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> </div> <div> <label class="block text-sm font-bold text-gray-700 mb-2">答案解析</label> <textarea v-model="questionForm.keyPoints" rows="3" placeholder="请输入答案解析或评分关键词" class="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"></textarea> </div> <div class="flex items-center gap-2"> <input type="checkbox" id="qEnabled" v-model="questionForm.enabled" class="w-4 h-4 text-primary rounded"> <label for="qEnabled" class="text-sm text-gray-700 font-bold">题目启用（启用后会被抽到试卷中）</label> </div> </div> <div class="flex gap-3 mt-6"> <button @click="closeQuestionModal" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">取消</button> <button @click="saveQuestion" class="flex-1 h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all">{{ editingQuestion ? '保存修改' : '新增题目' }}</button> </div> </div> </div> </div> <!-- 答题明细弹窗 --> <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" @click.self="closeDetailModal"> <div class="glass-modal relative z-10 p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"> <div class="flex items-center justify-between mb-4"> <h3 class="text-lg font-bold text-gray-900"> 答题明细</h3> <button @click="closeDetailModal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"></button> </div> <div v-if="detailResult" class="mb-4 p-3 bg-primary/5 rounded-2xl"> <div class="flex flex-wrap gap-4 text-sm"> <span><span class="text-gray-500">考生：</span><span class="font-bold">{{ detailResult.user_name }}</span></span> <span><span class="text-gray-500">UID：</span><span class="font-bold">{{ detailResult.user_uid }}</span></span> <span><span class="text-gray-500">总分：</span><span class="font-bold" :class="detailResult.percentage >= 80 ? 'text-success' : detailResult.percentage >= 60 ? 'text-primary' : 'text-danger'">{{ detailResult.total_score }} / {{ detailResult.max_score }}</span></span> <span><span class="text-gray-500">正确率：</span><span class="font-bold">{{ detailResult.percentage }}%</span></span> <span><span class="text-gray-500">试卷：</span><span class="font-bold">{{ detailResult.exam_name || '未知试卷' }}</span></span> <span><span class="text-gray-500">时间：</span><span class="font-bold">{{ formatTime(detailResult.created_at) }}</span></span> </div> </div> <div v-if="detailResult && detailResult.details && detailResult.details.length > 0" class="space-y-3"> <div v-for="(a, idx) in detailResult.details" :key="idx" class="p-4 rounded-2xl border-2 transition-all" :class="a.is_correct ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'"> <div class="flex items-start justify-between mb-2"> <div class="flex-1"> <span class="text-xs font-bold text-gray-400 mr-2">{{ idx + 1 }}.</span> <span class="text-sm font-bold text-gray-800">{{ a.title || '题目 ' + a.q_id }}</span> </div> <span class="text-xs px-2 py-1 rounded-lg font-bold ml-2 shrink-0" :class="a.is_correct ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">
              {{ a.is_correct ? ' 正确' : ' 错误' }}
            </span> </div> <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm pl-6"> <div><span class="text-gray-500">题型：</span><span class="font-bold">{{ typeLabel(a.type) }}</span></div> <div><span class="text-gray-500">得分：</span><span class="font-bold" :class="a.is_correct ? 'text-success' : 'text-danger'">{{ a.score }} / {{ a.max_score }}</span></div> <div class="md:col-span-2"> <span class="text-gray-500">用户答案：</span> <span class="font-bold break-all" :class="a.is_correct ? 'text-success' : 'text-danger'">{{ a.user_answer || '(未作答)' }}</span> </div> <div class="md:col-span-2"> <span class="text-gray-500">正确答案：</span> <span class="font-bold text-success break-all">{{ a.correct_answer || '-' }}</span> </div> <div v-if="a.key_points" class="md:col-span-2"> <span class="text-gray-500">解析：</span> <span class="text-gray-600 break-all">{{ a.key_points }}</span> </div> <div v-if="a.feedback" class="md:col-span-2"> <span class="text-gray-500">反馈：</span> <span class="text-gray-600 break-all">{{ a.feedback }}</span> </div> </div> </div> </div> <div v-else class="text-center text-gray-400 py-8">暂无答题记录</div> </div> </div> <!-- 预览试卷弹窗 --> <div v-if="showPreviewModal" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" @click.self="closePreviewModal"> <div class="glass-modal relative z-10 p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"> <div class="flex items-center justify-between mb-4"> <h3 class="text-lg font-bold text-gray-900"> 试卷预览</h3> <button @click="closePreviewModal" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"></button> </div> <div v-if="previewData" class="mb-4 p-3 bg-primary/5 rounded-2xl"> <div class="flex flex-wrap gap-4 text-sm"> <span><span class="text-gray-500">试卷：</span><span class="font-bold">{{ previewData.config.name }}</span></span> <span><span class="text-gray-500">总题数：</span><span class="font-bold">{{ previewData.totalQuestions }} 题</span></span> <span><span class="text-gray-500">满分：</span><span class="font-bold">{{ previewData.questions.reduce((sum, q) => sum + (q.score || 5), 0) }} 分</span></span> </div> </div> <div v-if="previewData && previewData.questions.length > 0" class="space-y-4"> <!-- 按题型分组 --> <div v-for="type in ['single', 'multiple', 'fill', 'essay']" :key="type"> <div v-if="previewData.questions.filter(q => q.type === type).length > 0"> <h4 class="text-sm font-bold text-gray-700 mb-2 px-2 py-1 bg-gray-100 rounded-lg">{{ typeLabel(type) }}（{{ previewData.questions.filter(q => q.type === type).length }} 题）</h4> <div v-for="(q, idx) in previewData.questions.filter(q => q.type === type)" :key="q.id" class="p-3 rounded-xl border border-gray-200 mb-2"> <div class="flex items-start gap-2 mb-2"> <span class="text-xs font-bold text-gray-400 mt-0.5">{{ idx + 1 }}.</span> <div class="text-sm font-bold text-gray-800">{{ q.content }}</div> </div> <div v-if="q.options && q.options.length > 0" class="pl-5 space-y-1 mb-2"> <div v-for="opt in q.options" :key="opt" class="text-sm text-gray-600">{{ opt }}</div> </div> <div v-if="q.blanks && q.blanks.length > 0" class="pl-5 text-sm text-gray-600 mb-2"> <div v-for="b in q.blanks" :key="b.blank_no">空{{ b.blank_no }} 答案：{{ b.answer }}</div> </div> <div class="pl-5 text-xs mt-2 flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100"> <span class="px-2 py-1 bg-primary/10 rounded-lg"><span class="text-gray-500">分值：</span><span class="font-bold text-primary">{{ q.score }} 分</span></span> <span><span class="text-gray-500">答案：</span><span class="font-bold text-success">{{ q.answer || q.key_points || '-' }}</span></span> </div> </div> </div> </div> </div> <div v-else class="text-center text-gray-400 py-8">暂无题目</div> <div class="flex gap-3 mt-4"> <button @click="closePreviewModal" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">关闭</button> <button v-if="previewData && previewData.config" @click="publishFromPreview" class="flex-1 h-12 bg-success text-white font-bold rounded-2xl hover:bg-success/90 transition-all"> 确认发布</button> </div> </div> </div> <!-- 题目预览弹窗 --> <div v-if="showQuestionPreviewModal" class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" @click.self="showQuestionPreviewModal = false"> <div class="glass-modal relative z-10 p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"> <div class="flex items-center justify-between mb-4"> <h3 class="text-lg font-bold text-gray-900"> 题目预览</h3> <button @click="showQuestionPreviewModal = false" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"></button> </div> <div v-if="currentPreviewQuestion" class="space-y-4"> <div class="flex items-center gap-2"> <span class="px-2 py-1 rounded-lg text-xs font-bold" :class="typeClass(currentPreviewQuestion.type)">{{ typeLabel(currentPreviewQuestion.type) }}</span> <span class="text-xs text-gray-500">ID: {{ currentPreviewQuestion.id }}</span> <span class="text-xs px-2 py-0.5 rounded-lg" :class="currentPreviewQuestion.enabled !== false ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'">{{ currentPreviewQuestion.enabled !== false ? '已启用' : '已禁用' }}</span> </div> <div class="p-4 bg-gray-50 rounded-2xl"> <p class="text-sm font-bold text-gray-700 mb-2">题干</p> <p class="text-sm text-gray-800 leading-relaxed">{{ currentPreviewQuestion.title }}</p> </div> <div v-if="currentPreviewQuestion.options && currentPreviewQuestion.options.length > 0" class="p-4 bg-gray-50 rounded-2xl"> <p class="text-sm font-bold text-gray-700 mb-2">选项</p> <div class="space-y-2"> <div v-for="opt in currentPreviewQuestion.options" :key="opt" class="text-sm text-gray-700">{{ opt }}</div> </div> </div> <div v-if="currentPreviewQuestion.type === 'fill' && currentPreviewQuestion.blanks && currentPreviewQuestion.blanks.length > 0" class="p-4 bg-gray-50 rounded-2xl"> <p class="text-sm font-bold text-gray-700 mb-2">填空答案</p> <div class="space-y-1"> <div v-for="b in currentPreviewQuestion.blanks" :key="b.blank_no" class="text-sm text-gray-700">空{{ b.blank_no }}：{{ b.answer }}</div> </div> </div> <div class="p-4 bg-primary/5 rounded-2xl"> <p class="text-sm font-bold text-gray-700 mb-2">答案</p> <p class="text-sm text-success font-bold">{{ currentPreviewQuestion.type === 'fill' ? currentPreviewQuestion.blanks?.map(b => b.answer).join(' / ') : currentPreviewQuestion.answer || '-' }}</p> </div> <div v-if="currentPreviewQuestion.keyPoints" class="p-4 bg-success/5 rounded-2xl"> <p class="text-sm font-bold text-gray-700 mb-2">解析</p> <p class="text-sm text-gray-700 leading-relaxed">{{ currentPreviewQuestion.keyPoints }}</p> </div> </div> <div class="flex gap-3 mt-4"> <button @click="showQuestionPreviewModal = false" class="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all">关闭</button> </div> </div> </div>
</template> <script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showToast = inject('showToast')
const currentTab = ref('questions')
const questions = ref([])
const stats = ref({ total: 0, single: 0, multiple: 0, fill: 0, essay: 0 })
const examConfigs = ref([])
const allResults = ref([])
const selectedExamId = ref('')

const showEditMenu = ref(false)
const editMode = ref(false)
const showQuestionModal = ref(false)
const editingQuestion = ref(null)
const questionForm = ref({
  type: 'single',
  content: '',
  optionsText: '',
  answer: '',
  blanksText: '',
  keyPoints: '',
  enabled: true
})

const editingConfig = ref(null)
const examForm = ref({ name: '', single: 10, multiple: 0, fill: 5, essay: 5, score_single: 5, score_multiple: 5, score_fill: 5, score_essay: 5, timeLimit: 0, bank_id: 1 })

// 回收站
const recycleBinItems = ref([])
const recycleBinSettings = ref({ retention_days: 30 })

// 课程管理
const packages = ref([])
const learnSelectedPkgId = ref(null)
const learnSelectedPkg = computed(() => packages.value.find(p => p.id === learnSelectedPkgId.value) || null)
const editingCourseId = ref(null)
const courseForm = ref({ title: '', type: 'video', video_path: '', content: '', duration_minutes: 0 })
const videoUploading = ref(false)
const videoUploadPercent = ref(0)
const learnProgress = ref([])
const progressFilterUid = ref('')
const progressFilterPkg = ref(null)

async function loadPackages() {
  try {
    const res = await fetch('/api/admin/packages')
    const data = await res.json()
    if (data.success) {
      packages.value = data.data
      if (!learnSelectedPkgId.value && packages.value.length > 0) {
        learnSelectedPkgId.value = packages.value[0].id
      }
    }
  } catch (e) {
    console.error('加载课包失败', e)
  }
}

async function savePackage(pkg) {
  try {
    const res = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pkg.name,
        description: pkg.description,
        cooldown_days: pkg.cooldown_days,
        exam_config_id: pkg.exam_config_id || null,
        enabled: pkg.enabled
      })
    })
    const data = await res.json()
    if (data.success) {
      showToast('课包已保存', 'success')
      loadPackages()
    } else {
      showToast(data.error || '保存失败', 'error')
    }
  } catch (e) {
    showToast('保存失败', 'error')
  }
}

async function deletePackage(pkg) {
  if (!confirm(`确定删除课包「${pkg.name}」？其下所有课程和学员进度将一并删除！`)) return
  try {
    const res = await fetch(`/api/admin/packages/${pkg.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('课包已删除', 'success')
      if (learnSelectedPkgId.value === pkg.id) learnSelectedPkgId.value = null
      loadPackages()
    } else {
      showToast(data.error || '删除失败', 'error')
    }
  } catch (e) {
    showToast('删除失败', 'error')
  }
}

function resetCourseForm() {
  editingCourseId.value = null
  courseForm.value = { title: '', type: 'video', video_path: '', content: '', duration_minutes: 0 }
}

function editCourse(c) {
  editingCourseId.value = c.id
  courseForm.value = {
    title: c.title,
    type: c.type,
    video_path: c.video_path || '',
    content: c.content || '',
    duration_minutes: c.duration_minutes || 0
  }
}

async function saveCourse() {
  if (!courseForm.value.title.trim()) {
    showToast('请填写课程标题', 'warning')
    return
  }
  if (courseForm.value.type === 'video' && !courseForm.value.video_path) {
    showToast('请先上传视频文件', 'warning')
    return
  }
  if (courseForm.value.type === 'article' && !courseForm.value.duration_minutes) {
    showToast('图文课请填写要求停留分钟数', 'warning')
    return
  }
  const isEdit = !!editingCourseId.value
  const url = isEdit ? `/api/admin/courses/${editingCourseId.value}` : '/api/admin/courses'
  try {
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...courseForm.value, package_id: learnSelectedPkgId.value })
    })
    const data = await res.json()
    if (data.success) {
      showToast(isEdit ? '课程已更新' : '课程已添加', 'success')
      resetCourseForm()
      loadPackages()
    } else {
      showToast(data.error || '保存失败', 'error')
    }
  } catch (e) {
    showToast('保存失败', 'error')
  }
}

async function toggleCourseEnabled(c) {
  try {
    const res = await fetch(`/api/admin/courses/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !c.enabled })
    })
    const data = await res.json()
    if (data.success) {
      loadPackages()
    } else {
      showToast(data.error || '操作失败', 'error')
    }
  } catch (e) {
    showToast('操作失败', 'error')
  }
}

async function deleteCourse(c) {
  if (!confirm(`确定删除课程「${c.title}」？学员该课程进度将一并删除。`)) return
  try {
    const res = await fetch(`/api/admin/courses/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('课程已删除', 'success')
      if (editingCourseId.value === c.id) resetCourseForm()
      loadPackages()
    } else {
      showToast(data.error || '删除失败', 'error')
    }
  } catch (e) {
    showToast('删除失败', 'error')
  }
}

function handleVideoUpload(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  if (file.size > 500 * 1024 * 1024) {
    showToast('文件超过 500MB 限制', 'error')
    return
  }
  videoUploading.value = true
  videoUploadPercent.value = 0
  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/admin/upload-video')
  xhr.setRequestHeader('Content-Type', 'application/octet-stream')
  xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name))
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      videoUploadPercent.value = Math.round(e.loaded / e.total * 100)
    }
  }
  xhr.onload = () => {
    videoUploading.value = false
    try {
      const data = JSON.parse(xhr.responseText)
      if (data.success) {
        courseForm.value.video_path = data.data.path
        showToast('视频上传成功', 'success')
      } else {
        showToast(data.error || '上传失败', 'error')
      }
    } catch (e) {
      showToast('上传失败', 'error')
    }
  }
  xhr.onerror = () => {
    videoUploading.value = false
    showToast('上传失败，请检查网络', 'error')
  }
  xhr.send(file)
}

async function loadLearnProgress() {
  try {
    const params = []
    if (progressFilterUid.value.trim()) params.push(`uid=${encodeURIComponent(progressFilterUid.value.trim())}`)
    if (progressFilterPkg.value) params.push(`package_id=${progressFilterPkg.value}`)
    const res = await fetch('/api/admin/learn-progress' + (params.length ? '?' + params.join('&') : ''))
    const data = await res.json()
    if (data.success) {
      learnProgress.value = data.data.students || []
    } else {
      showToast(data.error || '查询失败', 'error')
    }
  } catch (e) {
    showToast('查询失败', 'error')
  }
}

function examStatusBadge(status) {
  if (!status) return { text: '未开始', cls: 'bg-gray-100 text-gray-400' }
  switch (status.status) {
    case 'passed': return { text: `已通过 ${status.percentage}分`, cls: 'bg-success/10 text-success' }
    case 'ready': return { text: '可考试', cls: 'bg-success/10 text-success' }
    case 'cooldown': {
      const h = Math.floor((status.remaining_seconds || 0) / 3600)
      return { text: `冷却中(${h}h)`, cls: 'bg-danger/10 text-danger' }
    }
    case 'no_exam': return { text: '未配置考试', cls: 'bg-gray-100 text-gray-400' }
    default:
      return status.chain_locked
        ? { text: ' 需先过姐妹团', cls: 'bg-gray-100 text-gray-500' }
        : { text: `还差${status.remaining_courses || 0}门课`, cls: 'bg-primary/10 text-primary' }
  }
}

// 答题明细弹窗
const showDetailModal = ref(false)
const detailResult = ref(null)

// 题目预览
const showQuestionPreviewModal = ref(false)
const currentPreviewQuestion = ref(null)

// 成绩批量删除
const selectedResultIds = ref([])
const isAllResultsSelected = computed(() => {
  return filteredResults.value.length > 0 && filteredResults.value.every(s => selectedResultIds.value.includes(s.id))
})

function toggleSelectAllResults() {
  if (isAllResultsSelected.value) {
    selectedResultIds.value = []
  } else {
    selectedResultIds.value = filteredResults.value.map(s => s.id)
  }
}

function toggleResultSelect(id) {
  const idx = selectedResultIds.value.indexOf(id)
  if (idx >= 0) {
    selectedResultIds.value.splice(idx, 1)
  } else {
    selectedResultIds.value.push(id)
  }
}

async function batchDeleteResults() {
  if (selectedResultIds.value.length === 0) return
  if (!confirm(`确定删除选中的 ${selectedResultIds.value.length} 条考试记录？删除后将进入回收站，可在回收站中恢复。`)) return

  let successCount = 0
  let failCount = 0

  for (const id of selectedResultIds.value) {
    try {
      const res = await fetch(`/api/results/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        successCount++
      } else {
        failCount++
      }
    } catch (err) {
      failCount++
      console.error('批量删除失败', err)
    }
  }

  selectedResultIds.value = []
  await loadResults()
  await loadRecycleBin()

  alert(`批量删除完成：成功 ${successCount} 条${failCount > 0 ? '，失败 ' + failCount + ' 条' : ''}`)
}

// 分页
const currentPage = ref(1)
const pageSize = ref(30)

const totalPages = computed(() => Math.max(1, Math.ceil(questions.value.length / pageSize.value)))

const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return questions.value.slice(start, start + pageSize.value)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const maxButtons = 5
  let start = Math.max(1, current - Math.floor(maxButtons / 2))
  let end = Math.min(total, start + maxButtons - 1)
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1)
  }
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

const filteredResults = computed(() => {
  if (!selectedExamId.value) return allResults.value
  const examId = parseInt(selectedExamId.value)
  return allResults.value.filter(r => r.exam_id === examId)
})

// 题库管理
const questionBanks = ref([])
const currentBankId = ref(1)
const showNewBankModal = ref(false)
const newBankName = ref('')
const showBankMenu = ref(false)
const showEditBankModal = ref(false)
const editingBank = ref(null)
const editBankName = ref('')

// 批量导入
const showImportModal = ref(false)
const importFileName = ref('')
const importing = ref(false)

// 智能生题
const aiGenCount = ref(0)
const aiGenFileName = ref('')
const aiGenFile = ref(null)
const aiGenLoading = ref(false)
const aiGenQuestions = ref([])
const aiGenSelectedIds = ref([])
const aiGenBankId = ref(1)
const aiGenSingle = ref(5)
const aiGenMultiple = ref(3)
const aiGenFill = ref(3)
const aiGenEssay = ref(2)
const aiGenVariantSourceId = ref('')
const aiGenVariantCount = ref(3)
const aiGenVariantLoading = ref(false)
const lastGeneratedFile = ref('')
const lastGeneratedTime = ref(0)
const aiGenUpdateLoading = ref(false)
const aiGenUpdateResult = ref(null)
const showAiGenNewBank = ref(false)
const aiGenNewBankName = ref('')
const aiFileInput = ref(null)
const aiGenTextPreview = ref('')

// 智能生题编辑弹窗
const showAiGenEditModal = ref(false)
const editingAiGenIdx = ref(-1)
const aiGenEditForm = ref({
  type: 'single',
  content: '',
  optionsText: '',
  answer: '',
  blanksText: '',
  key_points: ''
})

function typeLabel(type) {
  if (type === 'single') return '单选'
  if (type === 'multiple') return '多选'
  if (type === 'fill') return '填空'
  if (type === 'essay') return '简答'
  return type
}

function typeClass(type) {
  if (type === 'single') return 'bg-blue-100 text-blue-700'
  if (type === 'multiple') return 'bg-green-100 text-green-700'
  if (type === 'fill') return 'bg-purple-100 text-purple-700'
  if (type === 'essay') return 'bg-orange-100 text-orange-700'
  return 'bg-gray-100 text-gray-600'
}

function formatTime(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goHome() {
  router.push('/')
}

// 管理员测试模式：直接进入考试，跳过反作弊检查
function startAdminTest() {
  localStorage.setItem('exam_admin_test', '1')
  router.push('/')
}

// 题库管理
async function loadQuestionBanks() {
  try {
    const res = await fetch('/api/question-banks')
    const data = await res.json()
    if (data.success) {
      questionBanks.value = data.data.banks
      currentBankId.value = data.data.current_bank_id
    }
  } catch (err) {
    console.error('加载题库列表失败', err)
  }
}

async function switchBank(bankId) {
  if (bankId === currentBankId.value) return
  try {
    const res = await fetch('/api/question-banks/activate', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank_id: bankId })
    })
    const data = await res.json()
    if (data.success) {
      currentBankId.value = bankId
      await loadQuestionBanks()
      await loadQuestions()
      showBankMenu.value = false
    }
  } catch (err) {
    console.error('切换题库失败', err)
  }
}

async function createBank() {
  if (!newBankName.value.trim()) {
    showToast('请输入题库名称', 'warning')
    return
  }
  try {
    const res = await fetch('/api/question-banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newBankName.value.trim() })
    })
    const data = await res.json()
    if (data.success) {
      await loadQuestionBanks()
      newBankName.value = ''
      showNewBankModal.value = false
      showToast('新建题库成功！', 'success')
    } else {
      showToast(data.error || '新建失败', 'error')
    }
  } catch (err) {
    console.error('新建题库失败', err)
    showToast('网络错误', 'error')
  }
}

function openEditBank(bank) {
  editingBank.value = bank
  editBankName.value = bank.name
  showEditBankModal.value = true
  showBankMenu.value = false
}

async function saveEditBank() {
  if (!editBankName.value.trim()) {
    showToast('请输入题库名称', 'warning')
    return
  }
  try {
    const res = await fetch(`/api/question-banks/${editingBank.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editBankName.value.trim() })
    })
    const data = await res.json()
    if (data.success) {
      await loadQuestionBanks()
      editingBank.value = null
      editBankName.value = ''
      showEditBankModal.value = false
      showToast('保存成功！', 'success')
    } else {
      showToast(data.error || '保存失败', 'error')
    }
  } catch (err) {
    console.error('保存题库失败', err)
    showToast('网络错误', 'error')
  }
}

// 批量导入
function handleImportFile(e) {
  const file = e.target.files[0]
  if (file) {
    importFileName.value = file.name
  }
}

async function submitImport() {
  if (!importFileName.value) return
  const fileInput = document.querySelector('input[type="file"]')
  const file = fileInput.files[0]
  if (!file) {
    showToast('请选择文件', 'warning')
    return
  }
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/questions/import', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      await loadQuestions()
      showImportModal.value = false
      importFileName.value = ''
      fileInput.value = ''
      showToast(`导入成功！共导入 ${data.data.imported} 道题目`, 'success')
    } else {
      showToast(data.error || '导入失败', 'error')
    }
  } catch (err) {
    console.error('导入失败', err)
    showToast('导入失败，请检查文件格式', 'error')
  } finally {
    importing.value = false
  }
}

// 智能生题
function handleAiGenFile(e) {
  const file = e.target.files[0]
  if (file) {
    aiGenFileName.value = file.name
    aiGenFile.value = file
  }
}

async function submitAiGen() {
  if (!aiGenFileName.value || !aiGenFile.value) {
    showToast('请选择文件', 'warning')
    return
  }

  // 禁止重复生成：同一文件5分钟内不能重复生成
  const now = Date.now()
  const cooldown = 5 * 60 * 1000 // 5分钟
  if (lastGeneratedFile.value === aiGenFileName.value && (now - lastGeneratedTime.value) < cooldown) {
    const remain = Math.ceil((cooldown - (now - lastGeneratedTime.value)) / 1000)
    showToast(`该文件已生成过，请等待 ${remain} 秒后再试`, 'warning')
    return
  }

  const file = aiGenFile.value

  aiGenLoading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('single_count', String(aiGenSingle.value))
    formData.append('multiple_count', String(aiGenMultiple.value))
    formData.append('fill_count', String(aiGenFill.value))
    formData.append('essay_count', String(aiGenEssay.value))

    const res = await fetch('/api/generate-questions', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      aiGenQuestions.value = data.data.questions || []
      aiGenTextPreview.value = data.data.text_preview || ''
      aiGenSelectedIds.value = aiGenQuestions.value.map((_, i) => i)
      if (aiGenQuestions.value.length === 0) {
        showToast('文档解析完成，但未提取到有效题目。请检查原文预览', 'warning')
      } else {
        lastGeneratedFile.value = aiGenFileName.value
      lastGeneratedTime.value = Date.now()
      showToast(`生成成功！共 ${aiGenQuestions.value.length} 道题目`, 'success')
      }
    } else {
      showToast(data.error || '生成失败', 'error')
    }
  } catch (err) {
    console.error('智能生题失败', err)
    showToast('生成失败，请检查文件格式', 'error')
  } finally {
    aiGenLoading.value = false
  }
}

// 基于文档智能更新题库
async function submitAiGenUpdate() {
  if (!aiGenFileName.value || !aiGenFile.value) {
    showToast('请先上传文档', 'warning')
    return
  }

  const file = aiGenFile.value

  aiGenUpdateLoading.value = true
  aiGenUpdateResult.value = null
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/update-questions-from-doc', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      aiGenUpdateResult.value = {
        updated: data.data.updated || [],
        added: data.data.added || []
      }
      aiGenTextPreview.value = data.data.text_preview || ''
      const total = (data.data.updated || []).length + (data.data.added || []).length
      if (total === 0) {
        showToast('现有题库与文档内容一致，无需更新', 'success')
      } else {
        showToast(`分析完成！建议更新 ${(data.data.updated || []).length} 题，新增 ${(data.data.added || []).length} 题`, 'success')
      }
    } else {
      showToast(data.error || '更新分析失败', 'error')
    }
  } catch (err) {
    console.error('智能更新失败', err)
    showToast('更新分析失败，请检查后端服务', 'error')
  } finally {
    aiGenUpdateLoading.value = false
  }
}

// 导入全部更新建议（更新+新增）
async function importAllUpdateSuggestions() {
  if (!aiGenUpdateResult.value) return

  const allQuestions = [
    ...(aiGenUpdateResult.value.updated || []),
    ...(aiGenUpdateResult.value.added || [])
  ]

  if (allQuestions.length === 0) {
    showToast('没有可导入的建议', 'warning')
    return
  }

  let successCount = 0
  for (const q of allQuestions) {
    try {
      const payload = {
        type: q.type || 'single',
        title: q.content || '',
        options: q.options || [],
        answer: q.answer || '',
        keyPoints: q.key_points || '',
        blanks: q.blanks || [],
        bankId: aiGenBankId.value
      }
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (res.ok) successCount++
    } catch (e) {
      console.error('导入失败', e)
    }
  }

  showToast(`成功导入 ${successCount}/${allQuestions.length} 题`, 'success')
  await loadQuestions()
  aiGenUpdateResult.value = null
}

// 基于现有题目生成变体题
async function submitAiGenVariants() {
  const sourceId = aiGenVariantSourceId.value
  if (!sourceId) {
    showToast('请先选择一道原题', 'warning')
    return
  }

  const sourceQ = questions.value.find(q => q.id === parseInt(sourceId))
  if (!sourceQ) {
    showToast('原题不存在，请重新选择', 'error')
    return
  }

  aiGenVariantLoading.value = true
  try {
    const payload = {
      question: {
        id: sourceQ.id,
        type: sourceQ.type,
        content: sourceQ.title,
        options: sourceQ.options || [],
        answer: sourceQ.answer || '',
        key_points: sourceQ.keyPoints || '',
        blanks: sourceQ.blanks || []
      },
      variant_count: aiGenVariantCount.value
    }

    const res = await fetch('/api/generate-variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success) {
      const variants = data.data.variants || []
      if (variants.length === 0) {
        showToast('未能生成变体题，请重试', 'warning')
      } else {
        aiGenQuestions.value = [...aiGenQuestions.value, ...variants]
        const startIdx = aiGenQuestions.value.length - variants.length
        for (let i = 0; i < variants.length; i++) {
          aiGenSelectedIds.value.push(startIdx + i)
        }
        aiGenTextPreview.value = ''
        showToast(`变体生成成功！共 ${variants.length} 道变体题`, 'success')
      }
    } else {
      showToast(data.error || '变体生成失败', 'error')
    }
  } catch (err) {
    console.error('变体生成失败', err)
    showToast('变体生成失败，请检查网络或AI配置', 'error')
  } finally {
    aiGenVariantLoading.value = false
  }
}

function openAiGenEdit(idx) {
  editingAiGenIdx.value = idx
  const q = aiGenQuestions.value[idx]
  aiGenEditForm.value = {
    type: q.type || 'single',
    content: q.content || '',
    optionsText: (q.options || []).join('\n'),
    answer: q.answer || '',
    blanksText: (q.blanks || []).map(b => `${b.blank_no ? '空' + b.blank_no + ':' : ''}${b.answer}`).join('\n'),
    key_points: q.key_points || ''
  }
  showAiGenEditModal.value = true
}

function closeAiGenEdit() {
  showAiGenEditModal.value = false
  editingAiGenIdx.value = -1
}

function saveAiGenEdit() {
  const idx = editingAiGenIdx.value
  if (idx < 0 || idx >= aiGenQuestions.value.length) return

  const form = aiGenEditForm.value
  const updated = {
    ...aiGenQuestions.value[idx],
    type: form.type,
    content: form.content,
    answer: form.answer,
    key_points: form.key_points
  }

  if (form.type === 'single' || form.type === 'multiple') {
    updated.options = form.optionsText.split('\n').map(s => s.trim()).filter(s => s)
  } else {
    updated.options = []
  }

  if (form.type === 'fill' && form.blanksText.trim()) {
    updated.blanks = form.blanksText.split('\n').map((line, i) => {
      const text = line.trim()
      if (!text) return null
      const parts = text.split(':')
      if (parts.length >= 2) {
        return { blank_no: i + 1, answer: parts.slice(1).join(':').trim() }
      }
      return { blank_no: i + 1, answer: text }
    }).filter(Boolean)
  }

  aiGenQuestions.value[idx] = updated
  showAiGenEditModal.value = false
  editingAiGenIdx.value = -1
  showToast('题目修改已保存', 'success')
}

function toggleAiGenSelect(idx) {
  const pos = aiGenSelectedIds.value.indexOf(idx)
  if (pos >= 0) {
    aiGenSelectedIds.value.splice(pos, 1)
  } else {
    aiGenSelectedIds.value.push(idx)
  }
}

function aiGenSelectAll() {
  aiGenSelectedIds.value = aiGenQuestions.value.map((_, i) => i)
}

function aiGenDeselectAll() {
  aiGenSelectedIds.value = []
}

async function importSelectedQuestions() {
  let targetBankId = aiGenBankId.value

  // 如果选择了新建题库
  if (targetBankId === -1) {
    showAiGenNewBank.value = true
    return
  }

  const selected = aiGenQuestions.value.filter((_, i) => aiGenSelectedIds.value.includes(i))
  let imported = 0

  for (const q of selected) {
    try {
      const newQuestion = {
        content: q.content,
        type: q.type,
        options: q.options || [],
        answer: q.answer || '',
        key_points: q.key_points || '',
        blanks: q.blanks || [],
        enabled: true
      }
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      })
      const data = await res.json()
      if (data.success) imported++
    } catch (e) {
      console.error('导入题目失败', e)
    }
  }

  showToast(`成功导入 ${imported} 道题目`, 'success')
  aiGenQuestions.value = []
  aiGenSelectedIds.value = []
  aiGenFileName.value = ''
  await loadQuestions()
}

async function createAiGenBank() {
  if (!aiGenNewBankName.value.trim()) {
    showToast('请输入题库名称', 'warning')
    return
  }
  try {
    const res = await fetch('/api/question-banks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: aiGenNewBankName.value.trim() })
    })
    const data = await res.json()
    if (data.success) {
      await loadQuestionBanks()
      aiGenBankId.value = data.data.id
      showAiGenNewBank.value = false
      aiGenNewBankName.value = ''
      showToast('新建题库成功！', 'success')
      // 继续导入
      await importSelectedQuestions()
    } else {
      showToast(data.error || '新建失败', 'error')
    }
  } catch (err) {
    console.error('新建题库失败', err)
    showToast('网络错误', 'error')
  }
}

async function deleteBank(bankId) {
  if (!confirm('确定删除该题库？题库中的所有题目也会被删除，此操作不可恢复。')) return
  try {
    const res = await fetch(`/api/question-banks/${bankId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadQuestionBanks()
      await loadQuestions()
    } else {
      showToast(data.error || '删除失败', 'error')
    }
  } catch (err) {
    console.error('删除题库失败', err)
  }
}

async function loadQuestions() {
  try {
    const res = await fetch(`/api/questions?bank_id=${currentBankId.value}`)
    const data = await res.json()
    if (data.success) {
      questions.value = data.data.all.map(q => ({
        id: q.id,
        type: q.type,
        title: q.content,
        options: q.options || [],
        answer: q.answer || '',
        keyPoints: q.key_points || q.keyPoints || '',
        blanks: q.blanks || [],
        enabled: q.enabled !== false
      }))
      stats.value = data.data.stats
      // 分页安全检查：如果当前页超出范围，自动回到最后一页
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value
      }
    }
  } catch (err) {
    console.error('加载题库失败', err)
  }
}

async function loadExamConfigs() {
  try {
    const res = await fetch('/api/exam-configs')
    const data = await res.json()
    console.log('[loadExamConfigs] response=', data)
    if (data.success) {
      examConfigs.value = data.data
      console.log('[loadExamConfigs] examConfigs set to', JSON.stringify(data.data))
    }
  } catch (err) {
    console.error('加载考试配置失败', err)
  }
}

async function loadResults() {
  selectedResultIds.value = []
  try {
    const url = selectedExamId.value ? `/api/results?exam_id=${selectedExamId.value}` : '/api/results'
    const res = await fetch(url)
    const data = await res.json()
    if (data.success) {
      allResults.value = data.data
    }
  } catch (err) {
    console.error('加载结果失败', err)
  }
}

// 启用/禁用题目
async function toggleQuestionEnabled(q) {
  try {
    const res = await fetch(`/api/questions/${q.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: q.enabled === false })
    })
    const data = await res.json()
    if (data.success) {
      q.enabled = !q.enabled
    }
  } catch (err) {
    console.error('更新失败', err)
  }
}

// 编辑模式
function toggleEditMode() {
  editMode.value = !editMode.value
  showEditMenu.value = false
}

// 打开新增题目
function openAddQuestion() {
  showEditMenu.value = false
  editingQuestion.value = null
  questionForm.value = {
    type: 'single',
    content: '',
    optionsText: '',
    answer: '',
    blanksText: '',
    keyPoints: '',
    enabled: true
  }
  showQuestionModal.value = true
}

// 打开编辑题目
function openEditQuestion(q) {
  editingQuestion.value = q
  const optionsText = q.options ? q.options.join('\n') : ''
  const blanksText = q.blanks ? q.blanks.map(b => `空${b.blank_no}答案:${b.answer}`).join('\n') : ''
  questionForm.value = {
    type: q.type,
    content: q.title,
    optionsText: optionsText,
    answer: q.answer || '',
    blanksText: blanksText,
    keyPoints: q.keyPoints || '',
    enabled: q.enabled !== false
  }
  showQuestionModal.value = true
}

// 关闭弹窗
function closeQuestionModal() {
  showQuestionModal.value = false
  editingQuestion.value = null
}

// 保存题目
async function saveQuestion() {
  const form = questionForm.value
  if (!form.content.trim()) {
    showToast('请输入题干内容', 'warning')
    return
  }

  const payload = {
    content: form.content,
    type: form.type,
    answer: form.answer || '',
    key_points: form.keyPoints || '',
    enabled: form.enabled
  }

  // 处理选项
  if (form.type === 'single' || form.type === 'multiple') {
    payload.options = form.optionsText.split('\n').map(s => s.trim()).filter(s => s)
  } else {
    payload.options = []
  }

  // 处理填空
  if (form.type === 'fill') {
    const blanks = []
    const lines = form.blanksText.split('\n').map(s => s.trim()).filter(s => s)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // 支持多种格式：空1答案:xxx、空1:xxx、1:xxx、直接写答案
      const match = line.match(/^空?(\d+)答案?[：:]\s*(.+)$/)
      if (match) {
        blanks.push({ blank_no: parseInt(match[1]), answer: match[2].trim() })
      } else if (line.includes(':') || line.includes('：')) {
        // 尝试用冒号分割
        const parts = line.split(/[：:]/)
        if (parts.length >= 2) {
          const left = parts[0].replace(/^空/, '').replace(/答案?$/, '').trim()
          const right = parts.slice(1).join(':').trim()
          const no = left ? parseInt(left) : (i + 1)
          if (!isNaN(no) && right) {
            blanks.push({ blank_no: no, answer: right })
          }
        }
      } else if (line) {
        // 没有冒号，直接作为当前空的答案
        blanks.push({ blank_no: i + 1, answer: line })
      }
    }
    payload.blanks = blanks
    // 如果解析出了空行但一个都没匹配上，提示用户
    if (lines.length > 0 && blanks.length === 0) {
      showToast('填空答案格式不正确，请按 "空1答案:xxx" 格式填写', 'warning')
      return
    }
  } else {
    payload.blanks = []
  }

  try {
    const method = editingQuestion.value ? 'PUT' : 'POST'
    const url = editingQuestion.value ? `/api/questions/${editingQuestion.value.id}` : '/api/questions'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success) {
      await loadQuestions()
      closeQuestionModal()
      showToast('保存成功！', 'success')
    } else {
      showToast(data.error || '保存失败', 'error')
    }
  } catch (err) {
    console.error('保存失败', err)
    showToast('网络错误', 'error')
  }
}

// 删除题目
async function deleteQuestion(id) {
  if (!confirm('确定删除该题目？')) return
  try {
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadQuestions()
    }
  } catch (err) {
    console.error('删除失败', err)
  }
}

// 状态标签
function statusLabel(status) {
  if (status === 'draft') return '草稿'
  if (status === 'published') return '已发布'
  if (status === 'stopped') return '已停止'
  return status
}

function statusClass(status) {
  if (status === 'draft') return 'bg-warning/10 text-warning'
  if (status === 'published') return 'bg-success/10 text-success'
  if (status === 'stopped') return 'bg-gray-200 text-gray-500'
  return 'bg-gray-200 text-gray-500'
}

// 预览试卷
const showPreviewModal = ref(false)
const previewData = ref(null)

async function previewExam(cfg) {
  try {
    const res = await fetch(`/api/exam-configs/${cfg.id}/preview`)
    const data = await res.json()
    if (data.success) {
      previewData.value = data.data
      showPreviewModal.value = true
    } else {
      showToast(data.error || '预览失败', 'error')
    }
  } catch (err) {
    console.error('预览失败', err)
    showToast('预览失败', 'error')
  }
}

function closePreviewModal() {
  showPreviewModal.value = false
  previewData.value = null
}

// 从预览弹窗发布
async function publishFromPreview() {
  if (!previewData.value || !previewData.value.config) return
  const id = previewData.value.config.id
  closePreviewModal()
  await publishExam(id)
}

// 发布试卷
async function publishExam(id) {
  if (!confirm('确定发布/恢复该试卷？发布后用户将可以参加该考试。当前已发布的试卷会被自动停止。')) return
  try {
    const res = await fetch(`/api/exam-configs/${id}/publish`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      await loadExamConfigs()
      showToast('试卷发布成功！', 'success')
    } else {
      showToast(data.error || '发布失败', 'error')
    }
  } catch (err) {
    console.error('发布失败', err)
    showToast('发布失败，请检查网络', 'error')
  }
}

// 停止试卷
async function stopExam(id) {
  if (!confirm('确定停止该试卷？停止后用户将无法再参加该考试。')) return
  try {
    const res = await fetch(`/api/exam-configs/${id}/stop`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      await loadExamConfigs()
    }
  } catch (err) {
    console.error('停止失败', err)
  }
}
function editConfig(cfg) {
  editingConfig.value = cfg
  examForm.value = { ...cfg }
}

function cancelEdit() {
  editingConfig.value = null
  examForm.value = { name: '', single: 10, multiple: 0, fill: 5, essay: 5, score_single: 5, score_multiple: 5, score_fill: 5, score_essay: 5, timeLimit: 0, bank_id: questionBanks.value.find(b => b.is_default)?.id || 1, publish_at: '', stop_at: '' }
}

async function saveExamConfig() {
  if (!examForm.value.name.trim()) {
    showToast('请输入试卷名称', 'warning')
    return
  }
  try {
    const method = editingConfig.value ? 'PUT' : 'POST'
    const url = editingConfig.value ? `/api/exam-configs/${editingConfig.value.id}` : '/api/exam-configs'
    console.log('[saveExamConfig] method=', method, 'url=', url, 'body=', JSON.stringify(examForm.value))
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examForm.value)
    })
    const data = await res.json()
    console.log('[saveExamConfig] response=', data)
    if (data.success) {
      await loadExamConfigs()
      console.log('[saveExamConfig] after reload, examConfigs=', JSON.stringify(examConfigs.value))
      cancelEdit()
      showToast('保存成功！', 'success')
    } else {
      showToast(data.error || '保存失败', 'error')
    }
  } catch (err) {
    console.error('保存失败', err)
    showToast('网络错误', 'error')
  }
}

async function deleteConfig(id) {
  if (!confirm('确定删除该试卷配置？删除后将进入回收站，可在回收站中恢复。')) return
  try {
    const res = await fetch(`/api/exam-configs/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadExamConfigs()
      await loadRecycleBin()
    }
  } catch (err) {
    console.error('删除失败', err)
  }
}

async function deleteResult(id) {
  if (!confirm('确定删除该考试记录？删除后将进入回收站，可在回收站中恢复。')) return
  try {
    const res = await fetch(`/api/results/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadResults()
      await loadRecycleBin()
    }
  } catch (err) {
    console.error('删除失败', err)
  }
}

// 查看答题明细
function showResultDetail(result) {
  detailResult.value = result
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailResult.value = null
}

// 回收站相关方法
async function loadRecycleBin() {
  try {
    const res = await fetch('/api/recycle-bin')
    const data = await res.json()
    if (data.success) {
      recycleBinItems.value = data.data
    }
  } catch (err) {
    console.error('加载回收站失败', err)
  }
}

async function loadRecycleBinSettings() {
  try {
    const res = await fetch('/api/recycle-bin/settings')
    const data = await res.json()
    if (data.success) {
      recycleBinSettings.value = data.data
    }
  } catch (err) {
    console.error('加载回收站设置失败', err)
  }
}

async function saveRecycleSettings() {
  try {
    const res = await fetch('/api/recycle-bin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retention_days: recycleBinSettings.value.retention_days })
    })
    const data = await res.json()
    if (data.success) {
      showToast('设置已保存', 'success')
      await loadRecycleBin()
    }
  } catch (err) {
    console.error('保存设置失败', err)
  }
}

async function restoreRecycleItem(id) {
  if (!confirm('确定恢复该项目？')) return
  try {
    const res = await fetch(`/api/recycle-bin/${id}/restore`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      await loadRecycleBin()
      await loadExamConfigs()
      await loadResults()
    }
  } catch (err) {
    console.error('恢复失败', err)
  }
}

async function permanentlyDeleteRecycleItem(id) {
  if (!confirm('确定彻底删除？此操作不可恢复！')) return
  try {
    const res = await fetch(`/api/recycle-bin/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadRecycleBin()
    }
  } catch (err) {
    console.error('删除失败', err)
  }
}

async function clearRecycleBin() {
  if (!confirm('确定清空回收站？所有项目将被彻底删除，此操作不可恢复！')) return
  try {
    const res = await fetch('/api/recycle-bin/clear', { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      await loadRecycleBin()
    }
  } catch (err) {
    console.error('清空失败', err)
  }
}

function isNearExpire(expireAt) {
  const now = new Date()
  const expire = new Date(expireAt)
  const diffDays = (expire - now) / (1000 * 60 * 60 * 24)
  return diffDays <= 3
}

// 加载 XLSX 库（CDN）
function loadXLSXScript() {
  return new Promise((resolve, reject) => {
    if (window.XLSX) return resolve()
    const script = document.createElement('script')
    script.src = 'https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('XLSX 加载失败'))
    document.head.appendChild(script)
  })
}

async function exportToExcel() {
  if (filteredResults.value.length === 0) {
    showToast('没有数据可导出', 'warning')
    return
  }
  try {
    await loadXLSXScript()
    const data = filteredResults.value.map((r, i) => ({
      '排名': i + 1,
      '点点昵称': r.user_name,
      '点点UID': r.user_uid,
      '总分': r.total_score,
      '满分': r.max_score,
      '正确率': r.percentage + '%',
      '考试时间': formatTime(r.created_at)
    }))
    const ws = window.XLSX.utils.json_to_sheet(data)
    const wb = window.XLSX.utils.book_new()
    window.XLSX.utils.book_append_sheet(wb, ws, '成绩统计')
    const examName = selectedExamId.value ? examConfigs.value.find(c => c.id === parseInt(selectedExamId.value))?.name || '成绩统计' : '成绩统计'
    window.XLSX.writeFile(wb, `${examName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  } catch (err) {
    console.error('导出失败', err)
    showToast('导出失败，请重试', 'error')
  }
}

// 打开题目预览
function openQuestionPreview(q) {
  currentPreviewQuestion.value = q
  showQuestionPreviewModal.value = true
}

// 导出题库为 Excel
async function exportQuestionsToExcel() {
  if (questions.value.length === 0) {
    showToast('题库中没有题目', 'warning')
    return
  }
  try {
    await loadXLSXScript()
    const typeMap = { single: '单选题', multiple: '多选题', fill: '填空题', essay: '简答题' }
    const data = questions.value.map((q, i) => {
      let options = '-'
      let answer = q.answer || '-'
      if (q.type === 'single' || q.type === 'multiple') {
        options = (q.options || []).join(' / ')
      } else if (q.type === 'fill') {
        answer = (q.blanks || []).map(b => b.answer || '').join(' / ')
      }
      return {
        '序号': i + 1,
        '题型': typeMap[q.type] || q.type,
        '题干': q.title,
        '选项': options,
        '答案': answer,
        '解析': q.keyPoints || '-',
        '状态': q.enabled !== false ? '启用' : '禁用'
      }
    })
    const ws = window.XLSX.utils.json_to_sheet(data)
    const wb = window.XLSX.utils.book_new()
    window.XLSX.utils.book_append_sheet(wb, ws, '题库')
    const bankName = questionBanks.value.find(b => b.id === currentBankId.value)?.name || '题库'
    window.XLSX.writeFile(wb, `${bankName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast('题库导出成功', 'success')
  } catch (err) {
    console.error('导出题库失败', err)
    showToast('导出题库失败', 'error')
  }
}

onMounted(async () => {
  await loadQuestionBanks()
  await loadQuestions()
  await loadExamConfigs()
  await loadResults()
  await loadRecycleBin()
  await loadRecycleBinSettings()
  await loadPackages()
  await loadLearnProgress()
})

// 切换到成绩统计标签时自动刷新数据
watch(currentTab, (newTab) => {
  if (newTab === 'results') {
    loadResults()
  }
  if (newTab === 'learn') {
    loadPackages()
    loadLearnProgress()
  }
})
</script>
