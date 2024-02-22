import React, { useState } from 'react';
import { NativeBaseProvider, Box, Input, Button, Alert, Collapse, VStack, HStack, IconButton, CloseIcon } from 'native-base';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions, Text, ScrollView } from 'react-native';
import RNFS from 'react-native-fs';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const App = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({status:false, show: false, message:""});
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlayTouchable: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    gif: {
      width: windowWidth * 0.8,
      height: windowHeight * 0.8,
    },
  });
  function generateUniqueSongName(songName) {
    const timestamp = Date.now(); 
    const randomChars = Math.random().toString(36).substring(2, 8); 
    const uniqueName = `${songName}_${timestamp}_${randomChars}`; 
    return uniqueName+'.mp3';
  }
  const handleConvertAndDownload = async () => {
    if (!videoUrl) {
      setAlert({status:false, show: true, message:"Lütfen alanı doldurun"});
      return;
    }
    try {
      setLoading(true);
      const url = 'youraddress/api/Mp3/ConvertVideoToMp3';
      const fileName = 'example';
      let newFileName = generateUniqueSongName(fileName);

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({videoUrl:videoUrl}),
      })
      .then((response) => {
        if (!response.ok) {
          setLoading(false); 
          setAlert({status:false, show: true, message:"Network response was not ok"});
          return false;
        }
        const contentDispositionHeader = response.headers.get('content-disposition');
       
        if (contentDispositionHeader) {
            const fileNameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = fileNameRegex.exec(contentDispositionHeader);
            if (matches != null && matches[1]) {
              newFileName = matches[1].replace(/['"]/g, '');
            }
        }
        return response.blob();
      })
      .then((blob) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result.split(',')[1]); 
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .then((base64Data) => {
        const filePath = RNFS.DownloadDirectoryPath + '/'+newFileName;
        return RNFS.exists(filePath)
          .then((exists) => {
            if (exists) {
              return RNFS.writeFile(filePath, base64Data, 'base64', 'append');
            } else {
              return RNFS.writeFile(filePath, base64Data, 'base64');
            }
          })
          .catch((error) => {
            setLoading(false); 
            setAlert({status:false, show: true, message:"Error checking file existence"});
          });
      })
      .then(() => {
        setLoading(false); 
        setAlert({status:true, show: true, message:"MP3 file downloaded successfully."});
      })
      .catch((error) => {
        setLoading(false); 
        setAlert({status:false, show: true, message:"Error downloading file"});
      });
    } catch (error) {
      setLoading(false); 
      setAlert({status:false, show: true, message:"Error downloading file"});
    }
  };
  return (
    <NativeBaseProvider>
      <View style={{flex: 1, backgroundColor:"white"}}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1 }}>
            <Image
              source={require('./images/youtube.png')}
              style={{ width: '100%', resizeMode: "contain", marginBottom:50, marginTop:200 }}
            />
            <Box w="100%" alignItems="center">
              <Collapse isOpen={alert.show}>
                {alert.show &&<Alert maxW="400" status={alert.status ? "success" : "error"}>
                  <VStack space={1} flexShrink={1} w="100%">
                    <HStack flexShrink={1} space={2} alignItems="center" justifyContent="space-between">
                      <HStack flexShrink={1} space={2} alignItems="center">
                        <Alert.Icon />
                        <Text fontSize="md" fontWeight="medium" _dark={{color: alert.status ? "#0a3522":"#58151c"}}>
                          {alert.message}
                        </Text>
                      </HStack>
                      <IconButton variant="unstyled" _focus={{
                      borderWidth: 0
                    }} icon={<CloseIcon size="3" />} _icon={{
                      color: "coolGray.600"
                    }} onPress={() => setAlert({status:false, show:false, message:""})} />
                    </HStack>
                  </VStack>
                </Alert>}
              </Collapse>
            </Box>
            <Box alignItems="center" style={{marginTop:50}}>
              <Input 
                type="text" 
                w="100%" 
                py="0" 
                borderColor="#FF0000"
                borderWidth="1"
                InputRightElement={
                  <Button 
                    style={{ 
                      backgroundColor: '#FF0000',
                      alignItems: 'center',
                    }} 
                    size="xs" 
                    rounded="none" 
                    w="1/6" 
                    h="full" 
                    onPress={handleConvertAndDownload}
                  >
                    <FontAwesomeIcon icon={faDownload} size={24} color="white" />
                  </Button>
                } 
                placeholder="Enter video URL"
                onChangeText={setVideoUrl}
                placeholderTextColor="#FF0000"
                style={{
                  color: '#FF0000',
                }}
              />
            </Box>
          </View>
        </ScrollView>
       
        {loading && (
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayTouchable} disabled={true}>
              <FastImage
                source={require('./images/loading.gif')}
                style={styles.gif}
                resizeMode={FastImage.resizeMode.contain}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </NativeBaseProvider>
  );
};

export default App;
