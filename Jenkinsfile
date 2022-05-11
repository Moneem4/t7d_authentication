@Library('galactech-shared-lib')_
pipeline {
  agent any
  stages {
    stage("init"){
      steps{
        script{
          dockerLogin("https://docker.galactechstudio.com","docker-cred")
        }

      }
    }
    stage("build docker images"){
      steps {
        script{
          if(BRANCH_NAME == 'authentication'){
            BuildImage('docker.galactechstudio.com/auth:latest')
          }
        }
      }
    }
    stage("push docker image"){
      steps {
        script{
          if(BRANCH_NAME == 'authentication'){
            dockerPush('docker.galactechstudio.com/auth:latest')
          }
        }
        sh "echo 'y' | docker system prune -a"
      }   
    }
    stage("deploy auth branch") {
      steps {
        script {
          sh 'envsubst < auth.yaml | kubectl delete -f -'
          sh 'envsubst < auth.yaml | kubectl apply -f -'
        }
      }
    }
  }
  post {
    success {
      discordSend description: "T7D $BRANCH_NAME    deployed successfully", link: env.BUILD_URL, result: currentBuild.currentResult, title: BRANCH_NAME, webhookURL: "https://discord.com/api/webhooks/907974702847377411/YAW4qz0j7A3skOVVRpDiuLran7tYLe52qMtVSOzn4zs9aro1A-MkFmr3mMa9F86ZsObo"
    }
  }
}
