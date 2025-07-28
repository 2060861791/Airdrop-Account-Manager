import { defineStore } from 'pinia'

const STORAGE_KEY = 'airdrop_accounts'

function loadAccounts() {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch {
        return []
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

const defaultX = () => ({ password: '', email: '', emailPwd: '', fa2: '' })
const defaultTG = () => ({ phone: '', fa2: '' })
const defaultDC = () => ({ account: '', password: '' })

export const useAccountStore = defineStore('account', {
    state: () => ({
        accounts: loadAccounts(),
        nextId: 1
    }),
    actions: {
        addAccount(account) {
            account.id = '空投' + this.nextId
            this.nextId++
            this.accounts.push(account)
            saveAccounts(this.accounts)
        },
        updateAccount(id, newData) {
            const idx = this.accounts.findIndex(acc => acc.id === id)
            if (idx !== -1) {
                this.accounts[idx] = { ...this.accounts[idx], ...newData }
                saveAccounts(this.accounts)
            }
        },
        deleteAccount(id) {
            this.accounts = this.accounts.filter(acc => acc.id !== id)
            saveAccounts(this.accounts)
        },
        setAccounts(list) {
            this.accounts = list
            saveAccounts(this.accounts)
        },
        importAccounts(list) {
            list.forEach(acc => {
                acc.id = '空投' + this.nextId
                this.nextId++
                acc.x = acc.x || defaultX()
                acc.tg = acc.tg || defaultTG()
                acc.dc = acc.dc || defaultDC()
            })
            this.accounts = this.accounts.concat(list)
            saveAccounts(this.accounts)
        },
        exportAccounts() {
            return this.accounts
        }
    }
}) 