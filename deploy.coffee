# Basic Deploy: Upload everything in /build straight to S3
_ = require("lodash")
mimeTypes = require("mime-types")
process.env.AWS_PROFILE = "paperize-editor-beta" # force to beta for now
AWS = require("aws-sdk")
Promise = require("bluebird")
s3PutObjectAsync = Promise.promisify(new AWS.S3().putObjectAsync)
cloudfrontCreateInvalidationAsync = Promise.promisify(new AWS.CloudFront().createInvalidationAsync)
fs = Promise.promisifyAll(require("fs"))
recursiveReaddir = require("recursive-readdir")

TARGET_BUCKET = 'beta.editor.paperize.io'
CLOUDFRONT_DISTRIBUTION_ID = "E32JZ9YALLPGSM"

# for each file in /build
recursiveReaddir('./build').then (files) ->
  itemCount = files.length
  # Strip the build dir from the path
  files = files.map (file) -> file.replace("build/", "")
  # Start uploading in parallel
  console.log("Uploading #{itemCount} files...")
  Promise.map files, uploadFileToS3, concurrency: 10

  .then ->
    console.log("Invalidating CloudFront cache...")
    cloudfrontCreateInvalidationAsync
      DistributionId: CLOUDFRONT_DISTRIBUTION_ID
      InvalidationBatch:
        CallerReference: String(Date.now())
        Paths:
          Quantity: 1
          Items: [ '/*' ]

  .then ->
    console.log("Done.")

uploadFileToS3 = (file) ->
  mimeType = mimeTypes.lookup(file) || 'application/octet-stream'

  s3PutObjectAsync({
    Bucket: TARGET_BUCKET
    Key:    file
    Body:   fs.createReadStream("./build/#{file}")
    ACL:    'public-read'
    ContentDisposition: 'inline'
    ContentType: mimeType

  }).then ->
    console.log "Uploaded #{file}, #{mimeType}"
