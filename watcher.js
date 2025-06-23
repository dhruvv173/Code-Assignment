const events=require('events')
const fs=require('fs');
const TRAILING_LINES=10;
const BUFFER_SIZE=8192;
const buffer=Buffer.alloc(BUFFER_SIZE);

class Watcher extends events.EventEmitter{
    constructor(watchFile){
        super();
        this.watchFile=watchFile;
        this.store=[];
        this.fileDescriptor=null;
    }

    async init(){
        this.store=[];
        return new Promise((resolve,reject)=>{
            fs.stat(this.watchFile,(err,stats)=>{

                if(err){
                    if (err.code === "ENOENT") {
                      console.error(
                        "File not found. Please check the file path."
                      );
                      return resolve([]); 
                    }
                    return reject(err);
                }

                const fileSize=stats.size;

                fs.open(this.watchFile,'r',(err,fd)=>{
                    if(err)return reject(err);
                    this.fileDescriptor=fd;

                    if(fileSize===0)return resolve([]);

                    const startPos=Math.max(0,fileSize-BUFFER_SIZE);
                    fs.read(fd,buffer,0,BUFFER_SIZE,startPos,(err,bytesRead)=>{
                        if(err){
                            console.error("Error in readig file",err)
                            return reject(err);
                        }

                        const data=buffer.slice(0,bytesRead).toString();
                        const logs=data.split('\n').filter(Boolean);
                        this.store=logs.slice(-TRAILING_LINES);
                        resolve(this.store);

                    })
                })

            })
        })
    }

    getLogs(){
        return this.store;
    }

    watch(curr,prev){
        if(curr.size<=prev.size)return;

        const offset=prev.size;
        const newSize=curr.size-prev.size;
        const watcher=this;

        fs.read(this.fileDescriptor,buffer,0,Math.min(BUFFER_SIZE,newSize),offset,(err,bytesRead)=>{
            if(err) throw err;

            const data=buffer.slice(0,bytesRead).toString();
            const logs=data.split('\n').filter(Boolean);

            logs.forEach(log=>{
                if(watcher.store.length>=TRAILING_LINES){
                    watcher.store.shift();
                }
                watcher.store.push(log);

            })
            watcher.emit('process',logs);
        })

    }

    start(){
        const watcher=this;
        this.init().then(()=>{
            fs.watchFile(this.watchFile,{interval:1000},(curr,prev)=>{
                watcher.watch(curr,prev);
            });

        }).catch(err=>{
            console.error("Error initializing watcher: ",err);
        })

    }
}
module.exports=Watcher;