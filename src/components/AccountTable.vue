<template>
    <el-card class="main-card">
        <div class="header-bar">
            <h2>撸空投账号管理系统</h2>
            <div class="header-actions">
                <el-input v-model="search" placeholder="搜索编号、钱包地址等" clearable class="search-input" />
                <el-button type="primary" @click="openAddDialog">新增账号</el-button>
                <el-button @click="importAccounts">导入</el-button>
                <el-button @click="exportAccounts">导出</el-button>
            </div>
        </div>
        <el-table :data="filteredAccounts" border stripe class="account-table" style="width: 100vw; min-width: 1800px;"
            :header-cell-style="centerStyle" :cell-style="centerStyle">
            <el-table-column prop="id" label="编号" width="90">
                <template #default="scope">
                    <span class="cell-copy id-nowrap" @click="copyText(scope.row.id)">{{ scope.row.id }}</span>
                </template>
            </el-table-column>
            <!-- X账号卡密 -->
            <el-table-column label="X账号卡密" min-width="400">
                <template #header>
                    <span class="x-section-header">X账号卡密</span>
                </template>
                <el-table-column v-for="(label, key) in xLabels" :key="'x'+key" :label="label" min-width="120">
                    <template #default="scope">
                        <span class="cell-copy x-section" @click="copyText(scope.row.x?.[key])">{{ scope.row.x?.[key]
                            }}</span>
                        <!-- 新增：如果是2FA字段，显示2FA验证码和倒计时，可点击复制，始终一行显示 -->
                        <template v-if="key === 'fa2' && scope.row.x?.fa2">
                            <span class="cell-copy x-section"
                                style="margin-left:8px; color:#409EFF; font-weight:bold; cursor:pointer; white-space:nowrap;"
                                @click.stop="copyText(getTotp(scope.row.x.fa2))" :title="'点击复制2FA验证码'">
                                {{ getTotp(scope.row.x.fa2) }}({{ getTotpCountdown() }})
                            </span>
                        </template>
                    </template>
                </el-table-column>
            </el-table-column>
            <!-- TG账号卡密 -->
            <el-table-column label="TG账号卡密" min-width="180" max-width="220">
                <template #header>
                    <span class="tg-section-header">TG账号卡密</span>
                </template>
                <el-table-column v-for="(label, key) in tgLabels" :key="'tg'+key" :label="label" min-width="120">
                    <template #default="scope">
                        <span class="cell-copy tg-section" @click="copyText(scope.row.tg?.[key])">{{ scope.row.tg?.[key]
                            }}</span>
                    </template>
                </el-table-column>
            </el-table-column>
            <!-- DC账号卡密 -->
            <el-table-column label="DC账号卡密" min-width="140" max-width="180">
                <template #header>
                    <span class="dc-section-header">DC账号卡密</span>
                </template>
                <el-table-column v-for="(label, key) in dcLabels" :key="'dc'+key" :label="label" min-width="120">
                    <template #default="scope">
                        <span class="cell-copy dc-section" @click="copyText(scope.row.dc?.[key])">{{ scope.row.dc?.[key]
                            }}</span>
                    </template>
                </el-table-column>
            </el-table-column>
            <el-table-column label="操作" width="160">
                <template #default="scope">
                    <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="deleteAccount(scope.row.id)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <!-- 新增/编辑账号弹窗 -->
        <el-dialog v-model="dialogVisible" :title="dialogMode === 'add' ? '新增账号' : '编辑账号'" width="600px">
            <el-form :model="form" label-width="150px" :rules="rules" ref="formRef">
                <!-- X账号卡密 -->
                <el-divider><span class="x-section-header">X账号卡密</span></el-divider>
                <el-row :gutter="10">
                    <el-col v-for="(label, key) in xLabels" :key="'xform'+key" :span="12">
                        <el-form-item :label="label" :prop="'x.'+key"
                            :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
                            <el-input v-model="form.x[key]" class="x-section" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <!-- TG账号卡密 -->
                <el-divider><span class="tg-section-header">TG账号卡密</span></el-divider>
                <el-row :gutter="10">
                    <el-col v-for="(label, key) in tgLabels" :key="'tgform'+key" :span="12">
                        <el-form-item :label="label" :prop="'tg.'+key"
                            :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
                            <el-input v-model="form.tg[key]" class="tg-section" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <!-- DC账号卡密 -->
                <el-divider><span class="dc-section-header">DC账号卡密</span></el-divider>
                <el-row :gutter="10">
                    <el-col v-for="(label, key) in dcLabels" :key="'dcform'+key" :span="12">
                        <el-form-item :label="label" :prop="'dc.'+key"
                            :rules="[{ required: true, message: '必填', trigger: 'blur' }]">
                            <el-input v-model="form.dc[key]" class="dc-section" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">确定</el-button>
            </template>
        </el-dialog>
        <input ref="fileInput" type="file" accept=".xlsx,.csv" style="display:none" @change="handleFileChange" />
    </el-card>
</template>

<script setup>
    import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
    import { ElMessage } from 'element-plus'
    import { useAccountStore } from '../stores/account'
    import * as XLSX from 'xlsx'
    // Base32 解码
    function base32toUint8Array(base32) {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let bits = "";
        let output = [];
        base32 = base32.replace(/=+$/g, "").toUpperCase();
        for (let i = 0; i < base32.length; i++) {
            const val = alphabet.indexOf(base32[i]);
            if (val === -1) throw new Error("Invalid base32 character");
            bits += val.toString(2).padStart(5, "0");
        }
        for (let i = 0; i + 8 <= bits.length; i += 8) {
            output.push(parseInt(bits.substring(i, i + 8), 2));
        }
        return new Uint8Array(output);
    }
    // HMAC-SHA1
    async function hmacSha1(key, message) {
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            key,
            { name: "HMAC", hash: "SHA-1" },
            false,
            ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, message);
        return new Uint8Array(signature);
    }
    // 生成6位TOTP验证码
    async function generateTOTP(secret, digits = 6, timeStep = 30, timestamp = Date.now()) {
        const key = base32toUint8Array(secret);
        const epoch = Math.floor(timestamp / 1000);
        const counter = Math.floor(epoch / timeStep);
        const counterBuffer = new ArrayBuffer(8);
        const counterView = new DataView(counterBuffer);
        counterView.setUint32(4, counter);
        const hmac = await hmacSha1(key, counterBuffer);
        const offset = hmac[hmac.length - 1] & 0xf;
        const code =
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);
        const otp = (code % 10 ** digits).toString().padStart(digits, "0");
        return otp;
    }
    const store = useAccountStore()
    const search = ref('')
    const dialogVisible = ref(false)
    const dialogMode = ref('add')
    // 移除solana和evm相关内容
    const form = ref({ x: { password: '', email: '', emailPwd: '', fa2: '' }, tg: { phone: '', fa2: '' }, dc: { account: '', password: '' } })
    const editId = ref(null)
    const formRef = ref()
    const fileInput = ref()

    const xLabels = { password: '密码', email: '邮箱', emailPwd: '邮箱密码', fa2: '2FA' }
    const tgLabels = { phone: '手机', fa2: '2FA密钥' }
    const dcLabels = { account: '账号', password: '密码' }

    const rules = {
        'x.password': [{ required: true, message: '必填', trigger: 'blur' }],
        'x.email': [{ required: true, message: '必填', trigger: 'blur' }],
        'x.emailPwd': [{ required: true, message: '必填', trigger: 'blur' }],
        'x.fa2': [{ required: true, message: '必填', trigger: 'blur' }],
        'tg.phone': [{ required: true, message: '必填', trigger: 'blur' }],
        'tg.fa2': [{ required: true, message: '必填', trigger: 'blur' }],
        'dc.account': [{ required: true, message: '必填', trigger: 'blur' }],
        'dc.password': [{ required: true, message: '必填', trigger: 'blur' }],
    }

    const filteredAccounts = computed(() => {
        if (!search.value) return store.accounts
        return store.accounts.filter(acc =>
            Object.values(acc).some(val => {
                if (typeof val === 'object') return Object.values(val).some(v => String(v).includes(search.value))
                return String(val).includes(search.value)
            })
        )
    })

    function copyText(text) {
        if (!text) return
        navigator.clipboard.writeText(text)
        ElMessage.success('已复制: ' + text)
    }
    function openAddDialog() {
        dialogMode.value = 'add'
        form.value = { x: { password: '', email: '', emailPwd: '', fa2: '' }, tg: { phone: '', fa2: '' }, dc: { account: '', password: '' } }
        dialogVisible.value = true
        editId.value = null
        nextTick(() => formRef.value && formRef.value.clearValidate())
    }
    function openEditDialog(row) {
        dialogMode.value = 'edit'
        form.value = JSON.parse(JSON.stringify(row))
        dialogVisible.value = true
        editId.value = row.id
        nextTick(() => formRef.value && formRef.value.clearValidate())
    }
    function submitForm() {
        formRef.value.validate(valid => {
            if (!valid) return
            if (dialogMode.value === 'add') {
                store.addAccount({ ...form.value })
                ElMessage.success('新增成功')
            } else if (dialogMode.value === 'edit') {
                store.updateAccount(editId.value, { ...form.value })
                ElMessage.success('修改成功')
            }
            dialogVisible.value = false
        })
    }
    function deleteAccount(id) {
        store.deleteAccount(id)
        ElMessage.success('删除成功')
    }
    function importAccounts() {
        fileInput.value.value = ''
        fileInput.value.click()
    }
    function cleanSplit(str) {
        if (!str) return []
        // 支持3个-或4个-分隔符
        let arr = str.split('----')
        if (arr.length === 1) arr = str.split('---')
        return arr.map(s => s.trim())
    }
    // 导入导出逻辑移除solana和evm
    function handleFileChange(e) {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = evt => {
            const data = new Uint8Array(evt.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 })
            // 解析表头和数据
            const [header, ...rows] = json
            const idx = {
                id: header.findIndex(h => h.includes('编号')),
                x: header.findIndex(h => h.includes('X账号卡密')),
                tg: header.findIndex(h => h.includes('TG账号卡密')),
                dc: header.findIndex(h => h.includes('DC账号卡密'))
            }
            const list = rows.map(row => ({
                x: (() => {
                    const arr = cleanSplit(row[idx.x] || '')
                    // 兼容两种格式：
                    // 1. 旧格式(6+项): 用户名---密码---邮箱---邮箱密码---FA2---token
                    // 2. 新格式(4项): 密码---邮箱---邮箱密码---FA2
                    if (arr.length >= 5) { // 旧格式或更长，密码在第二位
                        return {
                            password: arr[1] || '',
                            email: arr[2] || '',
                            emailPwd: arr[3] || '',
                            fa2: arr[4] || ''
                        }
                    } else { // 新格式，密码在第一位
                        return {
                            password: arr[0] || '',
                            email: arr[1] || '',
                            emailPwd: arr[2] || '',
                            fa2: arr[3] || ''
                        }
                    }
                })(),
                tg: (() => {
                    const arr = cleanSplit(row[idx.tg] || '')
                    return {
                        phone: arr[0] || '',
                        fa2: arr[1] || ''
                    }
                })(),
                dc: (() => {
                    const arr = cleanSplit(row[idx.dc] || '')
                    return {
                        account: arr[0] || '',
                        password: arr[1] || ''
                    }
                })()
            }))
            store.importAccounts(list)
            ElMessage.success('导入成功')
        }
        reader.readAsArrayBuffer(file)
    }
    function exportAccounts() {
        const data = [
            [
                '编号',
                'X账号卡密（密码---邮箱---邮箱密码---FA2）',
                'TG账号卡密（手机---FA2密码）',
                'DC账号卡密(账号---密码)'
            ],
            ...store.accounts.map(acc => [
                acc.id,
                [acc.x.password, acc.x.email, acc.x.emailPwd, acc.x.fa2].join('---'),
                [acc.tg.phone, acc.tg.fa2].join('---'),
                [acc.dc.account, acc.dc.password].join('---')
            ])
        ]
        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '账号列表')
        XLSX.writeFile(wb, '账号列表.xlsx')
        ElMessage.success('导出成功')
    }
    const centerStyle = { textAlign: 'center', justifyContent: 'center', alignItems: 'center', whiteSpace: 'normal' }

    // 2FA验证码缓存与异步刷新
    const totpTime = ref(Date.now())
    const totpCache = ref({})
    let totpTimer = null
    async function refreshTotpAll() {
        const accounts = store.accounts
        const cache = {}
        for (const acc of accounts) {
            const secret = acc.x?.fa2
            if (secret) {
                try {
                    cache[secret] = await generateTOTP(secret)
                } catch {
                    cache[secret] = '无效密钥'
                }
            }
        }
        totpCache.value = cache
    }
    onMounted(() => {
        refreshTotpAll()
        totpTimer = setInterval(() => {
            totpTime.value = Date.now()
            refreshTotpAll()
        }, 1000)
    })
    onUnmounted(() => {
        if (totpTimer) clearInterval(totpTimer)
    })
    function getTotp(secret) {
        if (!secret) return ''
        return totpCache.value[secret] || ''
    }
    function getTotpCountdown() {
        // 距离下一个30秒周期的剩余秒数
        return 30 - Math.floor((totpTime.value / 1000) % 30)
    }
</script>

<style scoped>
    .main-card {
        width: 100vw;
        min-width: 1800px;
        margin: 0;
        padding: 32px 24px 24px 24px;
        background: #fff;
        border-radius: 0;
        box-shadow: none;
    }

    .header-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
    }

    .header-bar h2 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        color: #409EFF;
    }

    .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .search-input {
        width: 260px;
    }

    .account-table {
        margin-top: 12px;
        border-radius: 8px;
        overflow: visible;
        width: 100vw;
        min-width: 1800px;
    }

    .cell-copy {
        cursor: pointer;
        transition: background 0.2s;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
        text-align: center;
        white-space: normal !important;
        word-break: break-all;
    }

    .cell-copy:hover {
        background: #e6f7ff;
        color: #409EFF;
    }

    :deep(.el-table__cell) {
        text-align: center !important;
        white-space: normal !important;
    }

    :deep(.el-table th) {
        text-align: center !important;
    }

    .x-section-header {
        color: #fff;
        background: #409EFF;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .tg-section-header {
        color: #fff;
        background: #67C23A;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .dc-section-header {
        color: #fff;
        background: #E6A23C;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .x-section {
        background: #ecf5ff;
    }

    .tg-section {
        background: #f0f9eb;
    }

    .dc-section {
        background: #fdf6ec;
    }

    .id-nowrap {
        white-space: nowrap !important;
    }
</style>