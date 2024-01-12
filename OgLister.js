const { httpOgList, httpOgListDegen, getHttp } = require('./https')

class OgLister {
  constructor({ httpUrl }) {
    this.http = getHttp({ httpUrl })
  }

  addOg = async (data) => this.http.post(`/ogCollection`, data)

  addOgToNotInList = async (data) => this.http.post(`/ogNotInList`, data)

  updateOg = async (id, data) => this.http.patch(`/ogCollection/${id}`, data)

  getAllOg = async () => this.http.get(`/ogCollection`)

  getAllNotInOg = async () => this.http.get(`/ogNotInList`)

  getCoinNotInOgCollection = async (token) =>
    this.http.get(`/ogNotInList?token=${token}`)

  getNotBalikTayaOg = async () => this.http.get(`/ogCollection?balikTaya=false`)

  getBalikTayaOg = async () => this.http.get(`/ogCollection?balikTaya=true`)
}

module.exports = { OgLister }
