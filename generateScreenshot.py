from selenium import webdriver
import sys, re, os, time
from wand.image import Image
from wand.display import display

def getDatetimeFromURI(uri):
  return re.findall('[0-9]{14}', uri)[0]

def main():
  lines = tuple(open('3strategies_20160318.txt','r'))

  strategy = ''
  urim = ''
  urir = ''
  imgfilename = ''
  for line in lines:
    ln = line.strip()
    if len(ln) == 0: continue

  
    if ln[:18] == "http://web.archive":
      urim = ln.replace('http://','').replace('/','')
      urimDT = getDatetimeFromURI(urim)
      createThumbnail(strategy, urir, ln, urimDT)
    elif ln[:4] == "http": # URI-R
      urir = ln.split(' ')[0].replace('http://','').replace('/','')
    else: # Strategy
      strategy = ln




def createThumbnail(strategy, urir, urim, datetime):
  if not os.path.exists(os.getcwd()+"/screenshots/"+urir):
    os.makedirs(os.getcwd()+"/screenshots/"+urir)

  fnStrat = ''
  if strategy == "Interval":
    fnStrat = "i_"
  elif strategy == "Temporal Interval":
    fnStrat = "ti_"
  elif strategy == "Random":
    fnStrat = "r_"
  else:
    print "ERROR IN STRATEGY!"
    sys.exit()
  
  fn = urir+"/"+fnStrat+datetime+'.png'
  print str(int(time.time())) + " Fetching " + urim
  driver = webdriver.PhantomJS() # or add to your PATH
  driver.set_window_size(1024, 768) # optional
  driver.get(urim)
  try:
    driver.execute_script("document.getElementById('wm-ipp').style.display = 'none';")
  except: # Sometimes the Wayback interface does not display
    ''' '''
  driver.save_screenshot(os.getcwd()+"/screenshots/"+fn) # save a screenshot to disk
  
  #Scale and crop
  with Image(filename=os.getcwd()+"/screenshots/"+fn) as img:
    #img.crop(0,0,img.width,img.width)
    img.resize(img.width, img.width)
    img.resize(200,200)
    img.save(filename=os.getcwd()+"/screenshots/"+fn)
  

if __name__ == "__main__":
    main()