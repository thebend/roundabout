del imgs.txt
del video.mp4
# consider removing shots outside certain hours
ls *.jpg | ? { ($_.CreationTime.Hour -ge 6) -and ($_.CreationTime.Hour -le 22) } | sort CreationTime | % { "file '$($_.name)'" | Out-File -FilePath imgs.txt -Encoding ascii -Append }
ffmpeg -r 12 -f concat -safe 0 -i imgs.txt -an -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" video.mp4