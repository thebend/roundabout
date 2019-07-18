import fetch from 'node-fetch'
import path from 'path'
import * as fs from 'fs'

const checkInterval = 5*60*1000
const camDir = 'http://images.drivebc.ca/bchighwaycam/pub/cameras/'

const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
const getDateString = () =>
	(new Date(Date.now() - tzoffset)).toISOString()
	.split('.')[0].replace('T', ' ').replace(/:/g, '-')

const getFileBuffer = async (url:string) => {
	const response = await fetch(url)
	const buffer = await response.buffer()
	return buffer
}

const ctime = (path:string) => fs.statSync(path).ctime.getTime()

const getLatestFile = (dir:string) => new Promise<Buffer>((resolve, reject) => {
	fs.readdir(dir, (err, files) => {
		if (files.length === 0) return resolve(undefined)
		const paths = files.map(i => path.join(dir, i))
		const latestPath = paths.sort((a, b) => ctime(a) - ctime(b)).pop()
		const buffer = fs.readFileSync(latestPath)
		resolve(buffer)
	})
})

type CameraProfile = {
	id:string
	name:string
	latest?:Buffer
}
type CameraSet = {[id:string]:CameraProfile}

const getLatestCameras = async () => ({
	east: {id: '111', name: 'east', latest: await getLatestFile('saves/east/')},
	west: {id: '892', name: 'west', latest: await getLatestFile('saves/west/')},
} as CameraSet)

const getNewCamera = async (profile:CameraProfile) => {
	const {id, name, latest} = profile
	const newBuffer = await getFileBuffer(`${camDir}${id}.jpg`)
	const different = !latest || newBuffer.compare(latest) !== 0
	if (!different) return
	profile.latest = newBuffer
	const filename = `saves/${name}/${getDateString()}.jpg`
	console.log(filename)
	fs.writeFile(filename, newBuffer, err => err && console.log(err))
}

const checkCameras = (cameras:CameraSet) => Object.values(cameras).forEach(getNewCamera)

const main = async () => {
	const cameras = await getLatestCameras()
	checkCameras(cameras)
	setInterval(()=>checkCameras(cameras), checkInterval)
}

main()