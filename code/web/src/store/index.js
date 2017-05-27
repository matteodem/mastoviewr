import Vue from 'vue'
import Vuex from 'vuex'
import api from '../lib/Api'
import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

// only put stuff into vuex state that needs to be shared and in local storage!

// TODO: display vuex view state (feed)
// TODO: add simple view state logic (home, mentions, tags, search?)
// TODO: create simple mastodon js library
// TODO: change name
export default new Vuex.Store({
  plugins: [createPersistedState({
    key: 'mastoviewrState'
  })],
  state: {
    clientId: '',
    clientSecret: '',
    apiEndpoint: '',
    accessToken: '',
    views: [
      {
        type: 'home',
      },
      {
        type: 'hashtag',
        data: { term: 'technology' },
      },
    ],
  },
  mutations: {
    mastodonInstanceRegistered(state, { apiEndpoint, clientId, clientSecret }) {
      state.apiEndpoint = apiEndpoint
      state.clientId = clientId
      state.clientSecret = clientSecret
    },
    mastodonInstanceResetted(state) {
      state.clientId = ''
      state.clientSecret = ''
      state.apiEndpoint = ''
    },
    accessTokenChanged(state, token) {
      state.accessToken = token
    },
    accessTokenRemoved(state) {
      state.accessToken = ''
    },
  },
  actions: {
    adjustMastodonUri({ commit }, usernameWithDomain) {
      if (usernameWithDomain.includes('@')) {
        const apiEndpoint = `https://${usernameWithDomain.split('@')[1]}`.replace(/\/+$/, '')

        api(apiEndpoint).registerApp().then(data => {
          const { client_id, client_secret } = data

          if (!client_id || !client_secret) {
            return alert(`Mastodon Instance not found! ${apiEndpoint}`)
          }

          commit('mastodonInstanceRegistered', {
            apiEndpoint,
            clientId: client_id,
            clientSecret: client_secret,
          })
        })
      } else {
        alert('Needs to have email like structure with @')
      }
    },
    resetMastodonUri({ commit }) {
      commit('mastodonInstanceResetted')
    },
    registerAccessToken({ commit, state }, { code, baseUri }) {
      api(state.apiEndpoint).getToken(code, state.clientId, state.clientSecret, baseUri)
        .then(data => {
          const { access_token: accessToken } = data

          commit('accessTokenChanged', accessToken)
          setTimeout(() => window.open(baseUri, '_self'), 500)
        })
    },
    validateAccessToken({ commit, state }) {
      const { accessToken, apiEndpoint } = state

      if (accessToken) {
        api(apiEndpoint).validateToken(accessToken).then(isValid => {
          if (!isValid) commit('accessTokenRemoved')
        })
      }
    },
    logOut({ commit }) {
      commit('accessTokenRemoved')
    },
  },
})
