<script setup lang="ts">
const { loggedIn, user, fetch: refreshSession } = useUserSession();
const credentials = reactive({
	email: "",
	password: "",
});
async function login() {
	const { data, error } = await useFetch("/api/login", {
		method: "POST",
		body: credentials,
	});

	if (error.value?.statusCode) {
		if ([400, 401].includes(error.value.statusCode)) {
			alert(error.value.statusMessage);
		}
		else {
			alert("Couldn't log in	. Please try again later.");
		}

		return;
	}

	await refreshSession();
	await navigateTo("/");
}
</script>

<template>
	<h1>Login</h1>
	<form @submit.prevent="login">
		<input
			v-model="credentials.email"
			type="email"
			placeholder="Email"
		>
		<input
			v-model="credentials.password"
			type="password"
			placeholder="Password"
		>
		<button type="submit">
			Login
		</button>
	</form>

	<NuxtLink to="/register">Don't have an account?</NuxtLink>
</template>
