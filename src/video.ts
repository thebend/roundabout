import path from 'path'
import * as fs from 'fs'
import {exec} from 'child_process'

const ctime = (path:string) => fs.statSync(path).ctime.getTime()

const getFmList = (paths:string[]) => paths
		.sort((a, b) => ctime(a) - ctime(b))
		.map(i=>`file '${i}'`)
		.join('\n')

const makeFmList = (dir:string) => new Promise<string>((resolve, reject) => {
	fs.readdir(dir, (err, files) => {
		const paths = files.filter(i=>path.extname(i)==='.jpg').map(i=>path.join(dir, i))
		const listContent = getFmList(paths)
		resolve(listContent)
	})
})

const onedriveDir = path.join('C:','users','benda','OneDrive','roundabout')
const videoRootDir = 'saves'
const generateVideo = async (dir:string) => {
	const fullVideoDir = path.join(videoRootDir, dir)
	const listContent = await makeFmList(fullVideoDir)
	const videoList = `${fullVideoDir}.txt`
	fs.writeFile(videoList, listContent, err => err && console.error(err))
	const videoFile = `${fullVideoDir}.mp4`
	const fmCmd = `ffmpeg -r 12 -f concat -safe 0 -i ${videoList} -y -an -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" ${videoFile}`
	exec(fmCmd, (error, stdout, stderr) => {
		console.log(stderr)
		fs.copyFile(videoFile, path.join(onedriveDir,`${dir}.mp4`), err => err && console.error(err))
	})
}

const generateVideos = async () => {
	// doing asynchronously would cause mess in stdout
	await generateVideo('west')
	await generateVideo('east')
}

generateVideos()
setInterval(generateVideos, 4*60*60*1000)