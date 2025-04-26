# What does it meant to do
- User first login / signup with email.
- User Upload the image the uploaded image hit the upload image api and before uploading the 
  image we use gemini api to generate the description and tags from the image.
  When the user hit the end point to upload the image, before saving the image the image in cloudinary save the image locally temporary and 
  hit the end point to generate the description and tags releated to that and create a payload to then save the image into cloudinary.
- save the deatils we get from the gemini's response (i.e the payload).
- create an api to fecth all the details of user , what images that they uploaded and with description.
- create an api to see the all user details of user only for superAdmin.